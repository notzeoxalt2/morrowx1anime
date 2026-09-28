/**
 * Morrow Standalone Anime Scraper: Anikage
 * Source Site: https://anikage.cc/
 * Real Server Integration with Native HLS Playback & Multi-Audio (Sub/Dub)
 */

const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function getTitleFromTmdb(tmdbId, mediaType) {
  try {
    const type = mediaType === "movie" ? "movie" : "tv";
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.name || json.title || json.original_name || json.original_title || null;
  } catch {
    return null;
  }
}

async function getStreams(tmdbId, mediaType = "tv", season = 1, episode = 1) {
  try {
    const safeEpisode = Number(episode) > 0 ? Number(episode) : 1;
    let queryTitle = null;

    if (/^\d+$/.test(String(tmdbId))) {
      queryTitle = await getTitleFromTmdb(tmdbId, mediaType);
    } else {
      queryTitle = String(tmdbId);
    }

    if (!queryTitle) return [];
    const cleanTitle = queryTitle.trim();

    const searchRes = await fetch(`https://anikage.cc/api/media/anime/search?q=${encodeURIComponent(cleanTitle)}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    if (!searchRes.ok) return [];
    const searchJson = await searchRes.json();
    const animeList = searchJson.data || [];
    if (!animeList.length) return [];

    const normTitle = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    const anime = animeList.find(a => {
      const rom = (a.title?.romaji || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const eng = (a.title?.english || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return rom.includes(normTitle) || eng.includes(normTitle) || normTitle.includes(rom) || normTitle.includes(eng);
    }) || animeList[0];

    const slug = anime.slug;
    if (!slug) return [];

    const serversRes = await fetch(`https://anikage.cc/api/media/anime/${slug}/episodes/${safeEpisode}/servers`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    if (!serversRes.ok) return [];
    const serversJson = await serversRes.json();
    const serverList = serversJson.servers || [];

    // Prioritized real servers available on Anikage
    const priorityServerIds = ['koto', 'megg', 'kiwi', 'wave', 'zen', 'suge', 'dib'];
    const streams = [];

    for (const s of priorityServerIds) {
      const sInfo = serverList.find(item => item.id === s);
      const subTypes = sInfo?.subTypes || ['sub', 'dub'];

      for (const t of subTypes) {
        try {
          const srcRes = await fetch(`https://anikage.cc/api/media/anime/${slug}/episodes/${safeEpisode}/sources?provider=${s}&type=${t}`, {
            headers: {
              'User-Agent': USER_AGENT,
              'Referer': `https://anikage.cc/watch/${slug}?ep=${safeEpisode}`,
              'Origin': 'https://anikage.cc'
            }
          });
          if (!srcRes.ok) continue;
          const srcJson = await srcRes.json();
          const sources = srcJson.sources || [];
          const subtitles = (srcJson.subtitles || []).map(sub => ({
            url: sub.file ? `https://og.bakayaro.live/m3u8/${sub.file}` : sub.embedUrl,
            language: sub.label || 'en',
            name: sub.label || 'English'
          })).filter(sub => sub.url);

          const serverNameFormatted = s.charAt(0).toUpperCase() + s.slice(1);
          const isDub = t === 'dub';

          for (const src of sources) {
            if (!src.url) continue;
            const streamUrl = `https://og.bakayaro.live/${src.isM3U8 ? 'm3u8' : 'stream'}/${src.url}`;
            const quality = src.quality || src.label || '1080p';
            const typeTag = isDub ? '[DUB]' : '[SUB]';
            const langDisplay = isDub ? '🗣️ English Dub' : '🇯🇵 Japanese Sub';

            streams.push({
              name: `Server ${serverNameFormatted} ${typeTag}`,
              title: `Anikage • Server ${serverNameFormatted} ${typeTag} | ${langDisplay} (${quality})`,
              url: streamUrl,
              quality: quality,
              language: isDub ? 'en' : 'ja',
              type: isDub ? 'dub' : 'sub',
              provider: 'Anikage',
              headers: {
                'Referer': 'https://anikage.cc/',
                'Origin': 'https://anikage.cc',
                'User-Agent': USER_AGENT
              },
              subtitles: subtitles
            });
          }

          // Gentle delay to avoid Cloudflare rate limit
          await new Promise(r => setTimeout(r, 120));
        } catch (_) {}
      }
    }

    return streams;
  } catch (err) {
    console.error(`[Anikage] ${err && err.message ? err.message : err}`);
    return [];
  }
}

module.exports = {
  getStreams
};
globalThis.getStreams = getStreams;
