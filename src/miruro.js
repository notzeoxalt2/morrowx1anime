// Miruro's current catalog API. Server/audio choices come from the episode response.
const MIRURO_BASE = 'https://www.miruro.to';
const MIRURO_HEADERS = {Referer:MIRURO_BASE+'/',Origin:MIRURO_BASE,'User-Agent':'Mozilla/5.0'};
const norm = s => String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
async function requestJson(url) {
  const response=await fetch(url,{headers:MIRURO_HEADERS});
  if(!response.ok) throw new Error('HTTP '+response.status);
  if((response.headers.get('content-type')||'').includes('octet-stream')) {
    const bytes=new Uint8Array(await response.arrayBuffer()),key='miruro/catalog';
    for(let i=0;i<bytes.length;i++)bytes[i]^=key.charCodeAt(i%key.length);
    return JSON.parse(morrowGzip.strFromU8(morrowGzip.gunzipSync(bytes)));
  }
  return response.json();
}
async function metadata(id,type,season,episode) {
  const value=String(id),key=globalThis.TMDB_API_KEY||'';
  if(!/^\d+$/.test(value)&&!/^tt\d+$/.test(value)) return {title:value,season};
  if(!key) throw new Error('Morrow TMDB key is unavailable');
  const mediaType=type==='movie'?'movie':'tv';
  let tmdbId=value;
  if(/^tt\d+$/.test(value)) {
    const result=await requestJson('https://api.themoviedb.org/3/find/'+value+'?external_source=imdb_id&api_key='+key);
    const match=(mediaType==='tv'?result.tv_results:result.movie_results)?.[0];
    if(!match)return null;
    tmdbId=String(match.id);
  }
  const show=await requestJson('https://api.themoviedb.org/3/'+mediaType+'/'+tmdbId+'?api_key='+key);
  const info={title:show.name||show.title,original:show.original_name||show.original_title,tmdbId,mediaType,season,year:Number((show.first_air_date||show.release_date||'').slice(0,4))};
  if(mediaType==='tv'&&!globalThis.MORROW_MEDIA_CONTEXT?.anilistId) {
    info.requestedEpisode=await requestJson('https://api.themoviedb.org/3/tv/'+tmdbId+'/season/'+season+'/episode/'+episode+'?api_key='+key);
    if(Number(info.requestedEpisode.season_number)!==season||Number(info.requestedEpisode.episode_number)!==episode)return null;
  }
  return info;
}
async function getStreams(id,type='tv',season=1,episode=1) {
  try {
    season=Math.max(1,Number(season)||1);episode=Math.max(1,Number(episode)||1);
    const info=await metadata(id,type,season,episode);if(!info?.title)return [];
    const context=globalThis.MORROW_MEDIA_CONTEXT||{};
    const search=title=>requestJson(MIRURO_BASE+'/api/v1/anime?q='+encodeURIComponent(title)+'&limit=5&sort=-popularity');
    let response=await search(info.title);
    if(context.anilistId&&!response.data?.some(row=>(row.external_ids?.anilist||[]).map(String).includes(context.anilistId))&&context.animeTitle)response=await search(context.animeTitle);
    const candidates=(response.data||[]).filter(row=>{
      if(context.anilistId)return (row.external_ids?.anilist||[]).map(String).includes(context.anilistId);
      const names=Object.values(row.title||{}).filter(Boolean).map(norm);
      const exact=names.includes(norm(info.title))||names.includes(norm(info.original));
      const sameId=info.tmdbId&&(row.external_ids?.[info.mediaType==='movie'?'tmdb_movie':'tmdb_tv']||[]).map(String).includes(String(info.tmdbId));
      if(!exact&&!sameId)return false;
      if(type==='movie'&&row.format!=='MOVIE')return false;
      if(type!=='movie'&&row.format==='MOVIE')return false;
      // Avoid selecting a sequel just because it shares the same TMDB show ID.
      return info.requestedEpisode ? sameId : !info.year||Number(row.season_year)===info.year;
    });
    let anime,sourceEpisode=Number(context.animeEpisode)||episode;
    if(info.requestedEpisode) {
      // TMDB seasons can combine multiple anime cours. Match the actual episode,
      // rather than treating TMDB's season-relative number as the site's number.
      const target=info.requestedEpisode,date=Date.parse(target.air_date);
      if(!Number.isFinite(date)||!target.name)return [];
      const matches=[];
      for(const row of candidates) {
        const listed=await requestJson(MIRURO_BASE+'/api/v1/anime/'+encodeURIComponent(row.id)+'/episodes?kind=regular&limit=10000');
        for(const ep of listed.data||[]) {
          const difference=Math.abs(Date.parse(ep.aired_on)-date);
          if(difference<=86400000)matches.push({anime:row,episode:Number(ep.episode_number),difference,titleMatches:norm(ep.title)===norm(target.name)});
        }
      }
      const exactDate=matches.filter(m=>m.difference===0),dated=exactDate.length?exactDate:matches;
      const sameTitle=dated.filter(m=>m.titleMatches),selected=sameTitle.length?sameTitle:dated;
      if(selected.length!==1)return [];
      anime=selected[0].anime;sourceEpisode=selected[0].episode;
    } else {
      if(candidates.length!==1)return [];
      anime=candidates[0];
    }
    // Ongoing series (including One Piece) have a null final episode count.
    if(Number(anime.episode_count)>0&&sourceEpisode>Number(anime.episode_count))return [];
    const playback=await requestJson(MIRURO_BASE+'/api/v1/anime/'+encodeURIComponent(anime.id)+'/episodes/'+sourceEpisode+'/play');
    if(Number(playback.episode_number)!==sourceEpisode)return [];
    const streams=[];
    for(const track of playback.tracks||[]) {
      if(!['sub','ssub','dub'].includes(track.track))continue;
      const audio=track.track==='dub'?'DUB':'SUB',language=audio==='DUB'?'en':'ja';
      for(const provider of track.providers||[])for(const server of provider.servers||[])for(const source of server.streams||[]) {
        if(!/^https?:\/\//i.test(source.url||'')||!['hls','mp4','dash'].includes(source.format))continue;
        const headers={...provider.headers,...server.headers,...source.headers};
        const q=source.quality||(source.resolution?.height?source.resolution.height+'p':'Auto');
        streams.push({
          name:'Miruro | '+provider.provider+' / '+server.server+' ['+audio+'] · '+q,
          title:info.title+' · S'+season+' E'+episode+' · '+server.server+' ['+audio+']',
          url:source.url,type:source.format==='hls'?'m3u8':source.format==='dash'?'mpd':'mp4',quality:q,language,
          provider:'Miruro',headers,sourceSite:MIRURO_BASE,
          subtitles:(provider.subtitles||[]).filter(s=>s.file&&s.language).map(s=>({url:s.file,language:s.language,name:s.label||s.language,headers})),
        });
      }
    }
    const seen=new Set();return streams.filter(s=>{const key=s.name+'|'+s.url;if(seen.has(key))return false;seen.add(key);return true});
  }catch(error){console.error('[Miruro] '+error.message);return []}
}
module.exports={getStreams};
