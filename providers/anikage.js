/**
 * Morrow Standalone Anime Scraper: Anikage
 * Source Site: https://anikage.cc/
 * Real Server Integration with Native HLS Playback & Multi-Audio (Sub/Dub)
 */

const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function getTitleFromTmdb(id, mediaType) {
  try {
    const isImdb = String(id).startsWith("tt");
    const url = isImdb
      ? `https://api.themoviedb.org/3/find/${id}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
      : `https://api.themoviedb.org/3/${mediaType === "movie" ? "movie" : "tv"}/${id}?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (isImdb) {
      const match = (json.tv_results && json.tv_results[0]) || (json.movie_results && json.movie_results[0]);
      return match ? (match.name || match.title || match.original_name) : null;
    }
    return json.name || json.title || json.original_name || json.original_title || null;
  } catch {
    return null;
  }
}

async function getStreams(tmdbId, mediaType = "tv", season = 1, episode = 1) {
  try {
    const safeEpisode = Math.max(1, parseInt(episode, 10) || 1);
    let queryTitle = null;

    if (String(tmdbId).startsWith("tt") || /^\d+$/.test(String(tmdbId))) {
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

    // Select top reliable servers to prevent 429 rate limiting
    const preferredServers = ['megg', 'koto', 'kiwi', 'wave'];
    const chosenServers = preferredServers.filter(s => serverList.some(item => item.id === s));
    const targetServerIds = chosenServers.length ? chosenServers : serverList.slice(0, 4).map(item => item.id);
    const fetchTasks = [];

    for (const s of targetServerIds) {
      const sInfo = serverList.find(item => item.id === s);
      const subTypes = sInfo?.subTypes || ['sub', 'dub'];

      for (const t of subTypes) {
        fetchTasks.push((async () => {
          try {
            const srcRes = await fetch(`https://anikage.cc/api/media/anime/${slug}/episodes/${safeEpisode}/sources?provider=${s}&type=${t}`, {
              headers: {
                'User-Agent': USER_AGENT,
                'Referer': `https://anikage.cc/watch/${slug}?ep=${safeEpisode}`,
                'Origin': 'https://anikage.cc'
              }
            });
            if (!srcRes.ok) return [];
            const srcJson = await srcRes.json();
            const sources = srcJson.sources || [];
            const embeds = srcJson.embeds || [];
            const subtitles = (srcJson.subtitles || []).map(sub => ({
              url: sub.file ? `https://og.bakayaro.live/m3u8/${sub.file}` : sub.embedUrl,
              language: sub.label || 'en',
              name: sub.label || 'English'
            })).filter(sub => sub.url);

            const serverNameFormatted = s.charAt(0).toUpperCase() + s.slice(1);
            const isDub = t === 'dub';
            const results = [];

            for (const src of sources) {
              if (!src.url) continue;
              const isM3u8 = src.isM3U8 !== false;
              const streamUrl = `https://og.bakayaro.live/${isM3u8 ? 'm3u8' : 'stream'}/${src.url}`;
              const quality = src.quality || src.label || '1080p';
              const typeTag = isDub ? '[DUB]' : '[SUB]';
              const langDisplay = isDub ? '🗣️ English Dub' : '🇯🇵 Japanese Sub';

              results.push({
                name: `Server ${serverNameFormatted} ${typeTag} • ${quality}`,
                title: `Anikage • Server ${serverNameFormatted} ${typeTag} • ${quality} | ${langDisplay}`,
                url: streamUrl,
                quality: quality,
                language: isDub ? 'en' : 'ja',
                type: isM3u8 ? 'hls' : 'mp4',
                provider: 'Anikage',
                headers: {
                  'Referer': 'https://anikage.cc/',
                  'Origin': 'https://anikage.cc',
                  'User-Agent': USER_AGENT
                },
                subtitles: subtitles
              });
            }

            for (const emb of embeds) {
              if (!emb.url) continue;
              const embServer = emb.server || 'Embed';
              const typeTag = isDub ? '[DUB]' : '[SUB]';
              const langDisplay = isDub ? '🗣️ English Dub' : '🇯🇵 Japanese Sub';
              results.push({
                name: `Server ${serverNameFormatted} (${embServer}) ${typeTag}`,
                title: `Anikage • Server ${serverNameFormatted} ${embServer} ${typeTag} | ${langDisplay}`,
                url: emb.url,
                quality: '1080p',
                language: isDub ? 'en' : 'ja',
                type: 'embed',
                provider: 'Anikage',
                headers: {
                  'Referer': 'https://anikage.cc/',
                  'Origin': 'https://anikage.cc',
                  'User-Agent': USER_AGENT
                },
                subtitles: subtitles
              });
            }

            return results;
          } catch (_) {
            return [];
          }
        })());
      }
    }

    const settled = await Promise.all(fetchTasks);
    const allStreams = settled.flat();

    // Sort: 1080p first, then 720p, then others
    allStreams.sort((a, b) => {
      const qA = a.quality.includes('1080') ? 3 : a.quality.includes('720') ? 2 : 1;
      const qB = b.quality.includes('1080') ? 3 : b.quality.includes('720') ? 2 : 1;
      return qB - qA;
    });

    return allStreams;
  } catch (err) {
    console.error(`[Anikage] ${err && err.message ? err.message : err}`);
    return [];
  }
}

module.exports = {
  getStreams
};
globalThis.getStreams = getStreams;
