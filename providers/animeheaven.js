// Genuine AnimeHeaven adapter: exact catalog title, exact episode key, site-published MP4 sources.
const AH_ROOT = 'https://animeheaven.me';
const AH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36';
function ahText(s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/&#(\d+);/g, (_,n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_,n) => String.fromCharCode(parseInt(n,16)))
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#039;|&apos;/g,"'").replace(/&nbsp;/g,' ').trim();
}
function ahNorm(s) {
  return ahText(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/\b(\d+)(st|nd|rd|th)\s+season\b/g,'season $1')
    .replace(/\bpart\s+(iii|ii|iv|i|v)\b/g,(_,roman)=>'part '+({i:1,ii:2,iii:3,iv:4,v:5}[roman]))
    .replace(/\bthe\s+final\s+season\b/g,'final season')
    .replace(/[^a-z0-9]+/g,' ').trim();
}
function ahSeasonNumber(s) {
  const title=ahNorm(s);
  const match=title.match(/\bseason\s+(\d+)\b/);
  return match?Number(match[1]):null;
}
function ahPartNumber(s) {
  const match=ahNorm(s).match(/\bpart\s+(\d+)\b/);
  return match?Number(match[1]):null;
}
function ahHasInstallmentMarker(s) { return /\b(?:season|final|part|cour|arc|hen)\b|\b\d+(?:st|nd|rd|th)\s+season\b/i.test(ahText(s)); }
async function ahFetch(url, options) {
  let timer;
  try {
    const r = await Promise.race([
      fetch(url, { ...options, headers: { 'User-Agent': AH_UA, Referer: AH_ROOT+'/', ...(options && options.headers || {}) } }),
      new Promise((_,reject) => { timer=setTimeout(() => reject(new Error('AnimeHeaven request timed out')),3000); })
    ]);
    if (!r.ok) throw new Error('AnimeHeaven HTTP '+r.status);
    return r;
  } finally { if(timer!==undefined)clearTimeout(timer); }
}
async function ahIdentity(id, mediaType, season, episode) {
  const context = globalThis.MORROW_MEDIA_CONTEXT || {};
  if (!context.anilistId && Number(season)>1) return null;
  // AnimeHeaven's catalog mixes whole-series pages with separate installment
  // pages. Keep both coordinates so the selected site's page determines which
  // one is used instead of assuming every title uses one numbering scheme.
  const seasonEpisode = Number(context.animeSeasonEpisode || episode || 1);
  const entryEpisode = Number(context.animeEpisode || episode || seasonEpisode);
  // AnimeHeaven mixes one flat franchise page with separate AniList installment
  // pages. Use AniList's verified installment episode on split pages; retain the
  // flat absolute coordinate as a fallback when the site only has one page.
  const ep = mediaType==='movie' ? 1 : (
    context.animeEpisodeNumbering==='anilist-entry'&&Number.isInteger(entryEpisode)&&entryEpisode>0
      ? entryEpisode : seasonEpisode
  );
  const absoluteEp = Number(context.animeEpisodeAbsolute || context.animeEpisode);
  if (!Number.isInteger(ep) || ep<1) return null;
  let title=context.animeTitle, aliases=[];
  if (title) {
    aliases=typeof globalThis.morrowAnimeTitleAliases==='function'
      ? globalThis.morrowAnimeTitleAliases(context)
      : [title];
  }
  if (!title) {
    const tmdb=String(id).replace(/^tmdb:/,'');
    if (!/^\d+$/.test(tmdb) || !globalThis.TMDB_API_KEY) return null;
    const meta=await (await ahFetch('https://api.themoviedb.org/3/'+(mediaType==='movie'?'movie':'tv')+'/'+tmdb+'?api_key='+globalThis.TMDB_API_KEY)).json();
    aliases=[meta.title,meta.name,meta.original_title,meta.original_name].filter(Boolean);
    title=aliases[0];
  }
  return title ? {title,aliases,ep,absoluteEp:Number.isInteger(absoluteEp)&&absoluteEp>0?absoluteEp:null,season:Number(context.animeSeason||season||1)} : null;
}
async function getStreams(id, mediaType='tv', season=1, episode=1) {
  try {
    const identity=await ahIdentity(id,mediaType,season,episode);
    if (!identity) return [];
    const expected=identity.aliases.map(ahNorm);
    const preferred=ahNorm(identity.title);
    const candidates=new Map();
    for (const query of [...new Set(identity.aliases)].slice(0,3)) {
      const html=await (await ahFetch(AH_ROOT+'/search.php?s='+encodeURIComponent(query))).text();
      const re=/<div\b[^>]*class=['"][^'"]*similarname[^'"]*['"][^>]*>\s*<a\b[^>]*href=['"](anime\.php\?[^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m=re.exec(html))) {
        const catalogTitle=ahText(m[2]);
        const base=catalogTitle.replace(/\s*\((?:English\s+)?Dub(?:bed)?\)\s*$/i,'');
        const normalized=ahNorm(base),catalogSeason=ahSeasonNumber(base);
        const requestedPart=ahPartNumber(identity.title),catalogPart=ahPartNumber(base);
        const partMatches=requestedPart===catalogPart;
        const installment=identity.season>1&&partMatches&&(
          (catalogSeason!==null&&catalogSeason===identity.season) ||
          (catalogSeason===null&&ahHasInstallmentMarker(base)&&(
            normalized===preferred || expected.some(alias=>alias!==normalized&&normalized.startsWith(alias+' '))
          ))
        );
        if (normalized===preferred || expected.includes(normalized) || installment) {
          candidates.set(m[1],{path:m[1],title:catalogTitle,dub:base!==catalogTitle,installment});
        }
      }
    }
    // Prefer the requested installment title over a same-franchise base page.
    // Search results include labels such as "2nd Season" while AniList/TMDB
    // uses "Season 2"; ahNorm canonicalizes those without fuzzy title matching.
    const selected=[false,true].map(dub=>{
      let matches=[...candidates.values()].filter(s=>s.dub===dub&&s.installment&&ahNorm(s.title.replace(/\s*\((?:English\s+)?Dub(?:bed)?\)\s*$/i,''))===preferred);
      if(!matches.length)matches=[...candidates.values()].filter(s=>s.dub===dub&&s.installment);
      if(!matches.length)matches=[...candidates.values()].filter(s=>s.dub===dub&&!s.installment&&expected.includes(ahNorm(s.title)));
      if(identity.season<=1)matches=[...candidates.values()].filter(s=>s.dub===dub&&expected.includes(ahNorm(s.title)));
      return matches.length===1?matches[0]:null;
    }).filter(Boolean);
    const result=[];
    for (const show of selected) {
      const watch=AH_ROOT+'/'+show.path;
      const page=await (await ahFetch(watch)).text();
      const declared=/<div\b[^>]*class=['"][^'"]*infotitle[^'"]*['"][^>]*>([\s\S]*?)<\/div>/i.exec(page);
      if (!declared || ahNorm(declared[1])!==ahNorm(show.title)) continue;
      const keys=[];
      const epRe=/<a\b[^>]*\bid\s*=\s*['"]([a-f0-9]{32})['"][^>]*>\s*<div\b[^>]*class=['"][^'"]*trackep0\s+watch[^'"]*['"][\s\S]*?<div\b[^>]*class\s*=\s*['"][^'"]*watch2[^'"]*['"]\s*>\s*(\d+)/gi;
      let match;
      const pageEpisodes=[];
      while ((match=epRe.exec(page))) {
        const siteEpisode=Number(match[2]);
        pageEpisodes.push({key:match[1],episode:siteEpisode});
      }
      const installmentPage=show.installment;
      const requestedPageEpisode=installmentPage?identity.ep:(identity.season>1?identity.absoluteEp:identity.ep);
      if(!requestedPageEpisode)return result;
      for(const item of pageEpisodes)if(item.episode===requestedPageEpisode)keys.push(item.key);
      if ([...new Set(keys)].length!==1) continue;
      const key=keys[0];
      // This cookie is how the site's normal episode links select their gate page.
      const gate=await (await ahFetch(AH_ROOT+'/gate.php',{headers:{Referer:watch,Cookie:'key='+key}})).text();
      const sourceRe=/<source\b[^>]*src=['"]([^'"]+)['"][^>]*type=['"]video\/mp4['"]/gi;
      const urls=[];
      while ((match=sourceRe.exec(gate))) {
        const url=ahText(match[1]);
        if (/^https:\/\/[^/]+\.animeheaven\.me\/video\.mp4\?/.test(url) && new URL(url).search.slice(1).split('&')[0]===key && !urls.includes(url)) urls.push(url);
      }
      const mediaHeaders={Referer:AH_ROOT+'/gate.php','User-Agent':AH_UA};
      // AnimeHeaven's first two fallback hosts can return 404 before its working
      // RT host responds. A short HEAD preflight incorrectly discarded that
      // valid route in Morrow's embedded runtime; return site-published links
      // and let the player/proxy establish actual playback readiness.
      for(const url of urls){
        const server=new URL(url).hostname.split('.')[0].toUpperCase();
        result.push({provider:'AnimeHeaven',name:'AnimeHeaven | '+server+' ['+(show.dub?'DUB':'SUB')+']',
          title:show.title+' • '+(installmentPage?'S'+identity.season+'E'+identity.ep:'Episode '+requestedPageEpisode)+' • '+server,url,type:'mp4',quality:'Auto',language:show.dub?'en':'ja',headers:mediaHeaders});
      }
    }
    return result;
  } catch (_) { return []; }
}
globalThis.getStreams=getStreams;
module.exports={getStreams};
