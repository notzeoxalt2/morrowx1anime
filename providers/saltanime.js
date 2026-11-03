const SALT_CONFIG = {"name":"SaltAnime","base":"https://saltanime.in","search":"php"};
/* Morrow: actual catalog pages and ordinary media hosts; no embed-as-media fallback. */
const SALT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const SALT_LANGUAGE = {english:'en',eng:'en',en:'en',japanese:'ja',jpn:'ja',ja:'ja',hindi:'hi',hin:'hi',hi:'hi',tamil:'ta',tam:'ta',ta:'ta',telugu:'te',tel:'te',te:'te',kannada:'kn',kan:'kn',kn:'kn',malayalam:'ml',mal:'ml',ml:'ml',bengali:'bn',ben:'bn',bn:'bn',marathi:'mr',mar:'mr',mr:'mr'};
const SALT_LANGUAGE_LABEL = {en:'English',ja:'Japanese',hi:'Hindi',ta:'Tamil',te:'Telugu',kn:'Kannada',ml:'Malayalam',bn:'Bengali',mr:'Marathi'};
function saltText(s) { return String(s || '').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCharCode(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#0?39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim(); }
function saltNorm(s) { return saltText(s).toLowerCase().replace(/[^a-z0-9]/g,''); }
function saltUploadTitlePrefix(title,episodeIndex) {
  return saltNorm(String(title||'').slice(0,episodeIndex)
    .replace(/\[[^\]]*\]/g,' ')
    .replace(/\((?:19|20)\d{2}\)/g,' ')
    .replace(/[\s._:-]+$/,''));
}
function saltTitleVariants(titles) {
  const out=[];
  const add=value=>{const clean=saltText(value);if(clean&&!out.some(existing=>saltNorm(existing)===saltNorm(clean)))out.push(clean);};
  for(const title of titles){
    add(title);
    const root=String(title||'').replace(/\s+(?:(?:season\s+\d+(?:\s+part\s+\d+)?)|(?:(?:\d+(?:st|nd|rd|th)|first|second|third|fourth|fifth)\s+season(?:\s+part\s+\d+)?)|(?:(?:the\s+)?final\s+season(?:\s+part\s+\d+)?))$/i,'').trim();
    if(root&&saltNorm(root)!==saltNorm(title))add(root);
    // These catalogs index the franchise under its short display name.
    if(/^demon\s+slayer\s*:\s*kimetsu\s+no\s+yaiba\b/i.test(title))add('Demon Slayer');
    // AnimeSalt's original-series catalog is displayed as "Ben 10: Classic"
    // even though search and the canonical series slug are simply "Ben 10".
    if(/^ben\s*10$/i.test(title.trim()))add('Ben 10: Classic');
  }
  return out;
}
function saltUrl(s,base) { try { const u=new URL(saltText(s).replace(/\\\//g,'/'),base); return /^https?:$/.test(u.protocol)?u.toString():null; } catch(_) {return null;} }
function saltBase64(s) { s=String(s).replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; if(typeof atob==='function')return atob(s); const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',bytes=[];let bits=0,value=0;for(const c of s){const n=chars.indexOf(c);if(n<0)continue;value=(value<<6)|n;bits+=6;if(bits>=8){bits-=8;bytes.push(String.fromCharCode((value>>bits)&255));}}return bytes.join(''); }
async function saltFetch(url,options) {
  /* Morrow bounds native fetches. Retry one transient transport/edge failure; do not retry client errors. */
  if(globalThis.SCRAPER_ID) {
    for(let attempt=0;attempt<2;attempt++) {
      try {
        const response=await fetch(url,options);
        if(attempt===1||(response.status!==0&&response.status!==429&&response.status<500))return response;
      } catch(error) { if(attempt===1)throw error; }
      await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));
    }
  }
  let timer; try { return await Promise.race([fetch(url,options),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('request timeout')),12000);})]); } finally {if(timer)clearTimeout(timer);}
}
function saltHeaders(referer) { const u=new URL(referer);return {'User-Agent':SALT_UA,Referer:referer,Origin:u.origin}; }
function saltLiteral(s) { return s.replace(/\\(?:x([0-9a-f]{2})|u([0-9a-f]{4})|([\\'"/nrt]))/gi,(_,x,u,c)=>x||u?String.fromCharCode(parseInt(x||u,16)):({n:'\n',r:'\r',t:'\t'}[c]||c)); }
function saltUnpack(html) { return html.replace(/}\s*\(\s*'((?:\\.|[^'\\])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:\\.|[^'\\])*)'\.split\('\|'\)/g,(_,p,radix,count,words)=>{const table=saltLiteral(words).split('|'),r=Number(radix);if(r<2||r>62||Number(count)>10000)return '';const num=s=>{let n=0;for(const c of s){const v=c>='a'&&c<='z'?c.charCodeAt(0)-87:c>='A'&&c<='Z'?c.charCodeAt(0)-29:Number(c);if(!Number.isFinite(v)||v>=r)return -1;n=n*r+v;}return n;};return saltLiteral(p).replace(/\b[0-9a-zA-Z]+\b/g,t=>{const n=num(t);return n>=0&&table[n]?table[n]:t;});}); }
function saltHostIdentity(html,target) {
  const match=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);if(!match)return true;
  const title=saltText(match[1]).replace(/\+/g,' ').replace(/\[[^\]]*\]/g,'').trim();
  // File titles are independent evidence. A site's wrongly attached upload must never play.
  const ep=title.match(/(?:\bS(\d{1,3})E(\d{1,5})\b|\b(?:episode|ep)\s*[-.:]?\s*(\d{1,5})\b|\b(\d{1,3})x(\d{1,5})\b)/i);
  if(!ep)return true;
  const uploadTitle=saltUploadTitlePrefix(title,ep.index);
  if(!target.titles.some(t=>saltNorm(t)&&saltNorm(t)===uploadTitle))return false;
  const uploadEpisode=Number(ep[2]||ep[3]||ep[5]);
  if(uploadEpisode!==target.sourceEpisode&&uploadEpisode!==target.relativeEpisode)return false;
  if((ep[1]||ep[4])&&Number(ep[1]||ep[4])!==target.sourceSeason)return false;
  return true;
}
async function saltMetadata(id,type,episode) {
  const context=globalThis.MORROW_MEDIA_CONTEXT||{},titles=[];
  const aliases=typeof globalThis.morrowAnimeTitleAliases==='function'
    ? globalThis.morrowAnimeTitleAliases(context) : [context.animeTitle].filter(Boolean);
  titles.push(...aliases);
  const raw=String(id).replace(/^tmdb:/,'');
  if(!/^\d+$/.test(raw)&&!/^tt\d+$/.test(raw)) {if(!/^(?:anilist|mal|kitsu|tmdb):/i.test(raw))titles.push(raw);}
  else {
    const key=globalThis.TMDB_API_KEY;
    if(key){const endpoint=/^tt/.test(raw)?'find/'+raw:'/'+(type==='movie'?'movie':'tv')+'/'+raw;try{const r=await saltFetch('https://api.themoviedb.org/3/'+endpoint.replace(/^\//,'')+'?api_key='+encodeURIComponent(key)+(/^tt/.test(raw)?'&external_source=imdb_id':''));if(r.ok){let j=await r.json();if(/^tt/.test(raw)){const list=type==='movie'?j.movie_results:j.tv_results;if(!list||list.length!==1)return null;j=list[0];}for(const t of [j.name,j.title,j.original_name,j.original_title])if(t&&!titles.includes(t))titles.push(t);}}catch(_) {}}
  }
  if(!titles.length)return null;
  const providerTitles=saltTitleVariants(titles);
  const absolute=String(context.animeEpisodeNumbering||'season-local').toLowerCase()==='absolute'
    ? Number(context.animeEpisodeAbsolute) : NaN;
  const mappedAbsolute=Number(context.animeEpisodeAbsolute);
  const relative=Number(context.animeSeasonEpisode||episode);
  return {titles:providerTitles,tv:type!=='movie',absolute:Number.isInteger(absolute)&&absolute>0?absolute:null,
    mappedAbsolute:Number.isInteger(mappedAbsolute)&&mappedAbsolute>0?mappedAbsolute:null,
    relativeEpisode:Number.isInteger(relative)&&relative>0?relative:Math.max(1,parseInt(episode,10)||1)};
}
function saltPageLinks(html,base,category) { const out=[];for(const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){const u=saltUrl(m[1],base);if(!u)continue;const path=new URL(u).pathname;if(!new RegExp('^/(?:'+category+')/[^/]+/?$').test(path))continue;const slug=path.split('/')[2];if(!out.some(v=>v.url===u))out.push({url:u,slug,label:saltText(m[2])});}return out; }
function saltSearchQueries(titles) {
  const queries=[];
  for(const title of titles.filter(t=>saltNorm(t)).slice(0,3)) {
    const plain=String(title).replace(/[^a-z0-9]+/gi,' ').replace(/\s+/g,' ').trim();
    for(const query of [title,plain])
      if(query&&!queries.some(value=>value.toLowerCase()===query.toLowerCase()))queries.push(query);
  }
  return queries;
}
async function saltCatalog(target) {
  const hits=[];
  for(const title of saltSearchQueries(target.titles)){const search=SALT_CONFIG.base+(SALT_CONFIG.search==='php'?'/search.php?search=':'/?s=')+encodeURIComponent(title);try{const r=await saltFetch(search,{headers:saltHeaders(SALT_CONFIG.base+'/')});if(!r.ok)continue;const html=await r.text();for(const link of saltPageLinks(html,r.url||search,target.tv?'series|anime':'movie|movies')){if(target.titles.some(t=>saltNorm(t)&&(saltNorm(t)===saltNorm(link.slug)||saltNorm(t)===saltNorm(link.label)))&&!hits.some(v=>v.url.replace(/\/$/,'')===link.url.replace(/\/$/,'')))hits.push(link);}}catch(_) {}}
  if(hits.length!==1)return null;
  const r=await saltFetch(hits[0].url,{headers:saltHeaders(SALT_CONFIG.base+'/')});if(!r.ok)return null;const html=await r.text();const title=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if(title&&!target.titles.some(t=>saltNorm(t)&&saltNorm(t)===saltNorm(title[1])))return null;
  return {url:r.url||hits[0].url,html,slug:hits[0].slug};
}
function saltChooseEpisode(links,target,season) {
  const unique=[];
  for(const link of links)if(link&&link.sourceSeason===season&&!unique.some(v=>v.sourceEpisode===link.sourceEpisode))unique.push(link);
  unique.sort((a,b)=>a.sourceEpisode-b.sourceEpisode);
  if(!unique.length)return null;
  // Season-local catalogs start at 1; never shift an omitted episode by its position.
  if(unique[0].sourceEpisode===1)return unique.find(v=>v.sourceEpisode===target.relativeEpisode)||null;
  // Some catalogs encode the franchise absolute episode in the route even when
  // their own season split differs from AniList/AniZip (e.g. Naruto Shippuden
  // S22E42 is route 22x500, while the provider's season 22 starts at 22x480).
  // Select only the exact mapped absolute episode inside the requested season.
  const absolute=target.mappedAbsolute||target.absolute;
  if(!Number.isInteger(absolute)||absolute<=0)return null;
  return unique.find(v=>v.sourceEpisode===absolute)||null;
}
function saltEpisode(catalog,target,season) {
  if(!target.tv)return {url:catalog.url,sourceSeason:0,sourceEpisode:0};
  const links=saltPageLinks(catalog.html,catalog.url,'episode').map(v=>{const m=v.slug.match(/^(.*)-(\d+)x(\d+)$/);return m&&saltNorm(m[1])===saltNorm(catalog.slug)?{url:v.url,sourceSeason:Number(m[2]),sourceEpisode:Number(m[3])}:null;}).filter(Boolean);
  return saltChooseEpisode(links,target,season);
}
function saltSeasonDataEpisode(catalog,target,season) {
  const match=catalog.html.match(/(?:const|let|var)\s+seasonsData\s*=\s*(\[[\s\S]*?\]);/i);
  if(!match)return null;
  let seasons;try{seasons=JSON.parse(match[1]);}catch(_){return null;}
  if(!Array.isArray(seasons))return null;
  const selected=seasons.find((item,index)=>Number(item&&item.season)===season||(!item?.season&&index+1===season));
  if(!selected||!Array.isArray(selected.episodes))return null;
  const episodes=selected.episodes.map(item=>{
    let route=item&&(item.link||item.url||item.href||item.id);if(typeof route!=='string')return null;
    if(/^episode\//i.test(route))route='/'+route;
    const url=saltUrl(route,catalog.url);if(!url)return null;
    const slug=new URL(url).pathname.match(/\/episode\/([^/]+)\/?$/i)?.[1]||'';
    const coordinates=slug.match(/^(.*)-(\d+)x(\d+)$/i);
    if(!coordinates||saltNorm(coordinates[1])!==saltNorm(catalog.slug))return null;
    const sourceEpisode=Number(coordinates[3]), siteNumber=Number(item.number);
    if(Number.isInteger(siteNumber)&&siteNumber>0&&siteNumber!==sourceEpisode)return null;
    return {url,sourceSeason:Number(coordinates[2]),sourceEpisode};
  }).filter(Boolean);
  return saltChooseEpisode(episodes,target,season);
}
async function saltFindEpisode(catalog,target,season) {
  if(!target.tv)return saltEpisode(catalog,target,season);
  // seasonsData is the authoritative list. A page can also contain a single
  // latest-episode link, which must not stand in for a missing season entry.
  if(/(?:const|let|var)\s+seasonsData\s*=/i.test(catalog.html))return saltSeasonDataEpisode(catalog,target,season);
  return saltEpisode(catalog,target,season);
}
function saltAbyssWrapper(url,page) {
  try {
    const wrapper=new URL(url),origin=new URL(page).origin;
    if(wrapper.origin!==origin||!/(?:multi-lang-plyr|player)\.php$/i.test(wrapper.pathname))return null;
    const encoded=wrapper.searchParams.get('data');if(!encoded)return null;
    const raw=saltBase64(encoded.replace(/ /g,'+'));
    const decoded=typeof TextDecoder==='undefined'?raw:new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0)));
    const items=JSON.parse(decoded);if(!Array.isArray(items))return null;
    const safe=items.filter(item=>{try{return typeof item.language==='string'&&/(?:^|\.)(?:abyssplayer\.com|abyss\.to)$/i.test(new URL(saltUrl(item.link,page)).hostname);}catch(_){return false;}});
    if(!safe.length)return null;
    const hindi=safe.find(item=>SALT_LANGUAGE[String(item.language).trim().toLowerCase()]==='hi');
    const ordered=hindi?[hindi,...safe.filter(item=>item!==hindi)]:safe;
    const json=JSON.stringify(ordered),bytes=new TextEncoder().encode(json);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
    wrapper.searchParams.set('data',btoa(binary));
    const selected=ordered[0],language=SALT_LANGUAGE[String(selected.language).trim().toLowerCase()]||'und';
    return {url:wrapper.href,validationUrl:saltUrl(selected.link,page),language,label:'Abyss · '+(language==='hi'?'Hindi default':'Site player')+' (opens in browser)',external:true};
  }catch(_){return null;}
}
function saltVerifiedAbyssIdentity(html,target) {
  const match=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);if(!match)return false;
  const title=saltText(match[1]).replace(/\+/g,' ').replace(/\[[^\]]*\]/g,'').trim();
  if(!target.tv){const name=title.replace(/\.[a-z0-9]{2,4}$/i,'').replace(/[\s._-]+(?:hin|hindi|eng|english|jpn|japanese|dub)$/i,'');return target.titles.some(t=>saltNorm(t)&&saltNorm(t)===saltNorm(name));}
  const ep=title.match(/(?:\bS(\d{1,3})E(\d{1,5})\b|\b(?:episode|ep)\s*[-.:]?\s*(\d{1,5})\b|\b(\d{1,3})x(\d{1,5})\b)/i);
  if(!ep||!saltHostIdentity(html,target))return false;
  if(target.sourceSeason>1&&!ep[1]&&!ep[4])return target.sourceEpisode!==target.relativeEpisode&&Number(ep[3])===target.sourceEpisode;
  return true;
}
function saltEmbeds(html,page) {
  const out=[];
  const audioFor=url=>{const path=new URL(url).pathname.toLowerCase();return /\/(?:dub)(?:\/|$)/.test(path)?'en':/\/(?:sub)(?:\/|$)/.test(path)?'ja':'und';};
  for(const m of html.matchAll(/multi-lang-plyr\.php\?data=([^"'\s<>]+)/gi)){try{const items=JSON.parse(saltBase64(decodeURIComponent(saltText(m[1]).split('&')[0])));for(const item of items){const url=saltUrl(item.link,page);if(url)out.push({url,language:SALT_LANGUAGE[String(item.language||'').toLowerCase()]||'und',label:'Abyss · '+(item.language||'Unknown audio')});}}catch(_) {}}
  for(const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)){const src=m[1].match(/data-src\s*=\s*["']([^"']+)/i);if(src){const url=saltUrl(src[1],page);if(url)out.push({url,language:'und',label:saltText(m[2])||'Server'});}}
  for(const m of html.matchAll(/<iframe\b[^>]*\b(?:data-src|src)\s*=\s*["']([^"']+)/gi)){const url=saltUrl(m[1],page);if(!url)continue;if(/(?:multi-lang-plyr|player)\.php\?data=/i.test(url)){const wrapper=saltAbyssWrapper(url,page);if(wrapper)out.push(wrapper);continue;}out.push({url,language:audioFor(url),label:new URL(url).hostname.includes('as-cdn')?'MyStream':/megaplay\./i.test(new URL(url).hostname)?'MegaPlay · '+(audioFor(url)==='en'?'DUB':audioFor(url)==='ja'?'SUB':'Auto'):new URL(url).hostname});}
  return out.filter((v,i,list)=>list.findIndex(x=>x.url===v.url)===i);
}
async function saltMedia(url,headers) {
  try {
    if(/\.mp4(?:[?#]|$)/i.test(url)){const r=await saltFetch(url,{method:'HEAD',headers});return r.ok&&/^video\//i.test(r.headers.get('content-type')||'')?{url:r.url||url,type:'mp4',quality:'Auto'}:null;}
    const r=await saltFetch(url,{headers});if(!r.ok)return null;const mime=r.headers.get('content-type')||'';
    if(/^video\//i.test(mime))return {url:r.url||url,type:'mp4',quality:'Auto'};
    const body=(await r.text()).trim();
    if(body.startsWith('#EXTM3U'))return {url:r.url||url,type:'m3u8',quality:'Auto'};
    if(/<MPD\b/.test(body)&&!/<ContentProtection\b/.test(body))return {url:r.url||url,type:'mpd',quality:'Auto'};
  }catch(_) {}return null;
}
async function saltResolve(embed,target,page,depth,seen) {
  if(depth>3||seen[embed.url])return [];seen[embed.url]=true;
  const host=new URL(embed.url).hostname;
  if(embed.external) {
    try {
      const player=await saltFetch(embed.validationUrl,{headers:saltHeaders(embed.url),timeoutMs:10000});
      if(!player.ok||!/(?:^|\.)(?:abyssplayer\.com|abyss\.to)$/i.test(new URL(player.url||embed.validationUrl).hostname)||!saltVerifiedAbyssIdentity(await player.text(),target))return [];
      const wrapper=await saltFetch(embed.url,{headers:saltHeaders(page),timeoutMs:10000});
      if(!wrapper.ok||new URL(wrapper.url||embed.url).origin!==new URL(page).origin)return [];
      const wrapperHtml=await wrapper.text();if(!/<iframe\b/i.test(wrapperHtml)||!wrapperHtml.includes(new URL(embed.validationUrl).hostname))return [];
      return [{url:embed.url,type:'external',quality:'Site player',language:embed.language,label:embed.label,headers:{},subtitles:[]}];
    }catch(_){return [];}
  }
  // Abyss is eligible only if its page exposes ordinary, independently reachable
  // HLS/MP4 media below. Do not treat its player page or custom byte transport as media.
  const headers=saltHeaders(page);
  if(/\.(?:m3u8|mpd|mp4)(?:[?#]|$)/i.test(embed.url)){const direct=await saltMedia(embed.url,headers);return direct?[Object.assign(direct,{language:embed.language,label:embed.label,headers,subtitles:[]})]:[];}
  try {
    const r=await saltFetch(embed.url,{headers});if(!r.ok)return [];const actual=r.url||embed.url,html=await r.text();if(!saltHostIdentity(html,target))return [];
    if(/filesforever\.link$/.test(host)){
      const sid=html.match(/const sid\s*=\s*["']([^"']+)/);if(!sid)return [];
      const endpoint=new URL('/embedhelper2.php',actual).toString();
      const api=await saltFetch(endpoint,{method:'POST',headers:Object.assign(saltHeaders(actual),{'Content-Type':'application/x-www-form-urlencoded'}),body:'sid='+encodeURIComponent(sid[1])+'&UserFavSite=&currentDomain='+encodeURIComponent(JSON.stringify([new URL(page).hostname,new URL(actual).hostname]))});
      if(!api.ok)return [];const j=await api.json();if(j.domain_blocked||!j.sources||!j.mresult)return [];
      const ids=JSON.parse(saltBase64(j.mresult)),results=[];
      for(const key of Object.keys(j.sources)){const src=j.sources[key];if(!ids[key]||!src.siteUrl)continue;const url=saltUrl(src.siteUrl+ids[key]+(src.embed_suffix||''),actual);if(url)results.push(...await saltResolve({url,language:embed.language,label:embed.label+' / '+(src.friendlyName||key)},target,actual,depth+1,seen));}return results;
    }
    const myStream=await saltMyStream(html,actual,page,target,embed);if(myStream!==null)return myStream;
    const mega=await saltMegaSource(actual,html,embed);if(mega!==null)return mega;
    let content=saltUnpack(html);
    // Byse's public details identify the upload independently of the source site's label.
    if(/byse[^.]*\.com$/.test(new URL(actual).hostname)&&/\/e\/([^/]+)$/.test(new URL(actual).pathname)){
      const code=new URL(actual).pathname.split('/').pop(),detail=await saltFetch(new URL('/api/videos/'+code+'/embed/details',actual).toString(),{headers:saltHeaders(actual)});
      if(!detail.ok)return [];const j=await detail.json();if(j.title&&!saltHostIdentity('<title>'+j.title+'</title>',target))return [];
      if(j.embed_frame_url)return saltResolve({url:saltUrl(j.embed_frame_url,actual),language:embed.language,label:embed.label},target,actual,depth+1,seen);
    }
    const sourceUrls=[];
    for(const m of content.matchAll(/(?:file|src|hls|hlsUrl|video_url)\s*[:=]\s*["']((?:\\.|[^"'\\])+)["']/gi)){const url=saltUrl(saltLiteral(m[1]),actual);if(url&&/\.(?:m3u8|mp4|mpd)(?:[?#]|$)/i.test(url)&&!sourceUrls.includes(url))sourceUrls.push(url);}
    for(const m of content.matchAll(/<source\b[^>]*\bsrc\s*=\s*["']([^"']+)/gi)){const url=saltUrl(m[1],actual);if(url&&!sourceUrls.includes(url))sourceUrls.push(url);}
    const mediaHeaders=saltHeaders(actual),subtitles=[];
    for(const m of content.matchAll(/file\s*:\s*["']([^"']+\.vtt(?:\?[^"']*)?)["'][\s\S]{0,180}?label\s*:\s*["']([^"']+)/gi)){const url=saltUrl(m[1],actual);if(url)subtitles.push({url,name:saltText(m[2]),language:SALT_LANGUAGE[m[2].toLowerCase()]||'und',headers:mediaHeaders});}
    const results=[];for(const url of sourceUrls){const media=await saltMedia(url,mediaHeaders);if(media)results.push(Object.assign(media,{language:embed.language,label:embed.label,headers:mediaHeaders,subtitles}));}
    if(!results.length){for(const m of html.matchAll(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)/gi)){const url=saltUrl(m[1],actual);if(url)results.push(...await saltResolve({url,language:embed.language,label:embed.label},target,actual,depth+1,seen));}}
    return results;
  }catch(_) {return [];}
}
async function saltMegaSource(actual,html,embed) {
  if(!/megaplay\./i.test(new URL(actual).hostname)||!/\/stream\/s-2\/\d+\/(?:sub|dub)(?:\/|\?|$)/i.test(new URL(actual).pathname+new URL(actual).search))return null;
  try {
    const origin=new URL(actual).origin;
    const fileId=(html.match(/data-id=["']([^"']+)/i)||[])[1];
    const clientPath=(html.match(/<script\b[^>]*src=["']([^"']*newclient[^"']+)/i)||[])[1];
    if(!fileId||!clientPath)return [];
    const clientResponse=await saltFetch(new URL(clientPath,origin).href,{headers:{Referer:actual,Accept:'*/*'}});
    if(!clientResponse.ok)return [];
    const client=await clientResponse.text();
    const keyText=(client.match(/trustAesKey[^\n]+?\],"([^"]+)"/)||[])[1];
    const ivText=(client.match(/trustAesIv[^\n]+?\],"([^"]+)"/)||[])[1];
    const route=(client.match(/["'](stream\/getSourcesNew)["']/)||[])[1];
    if(!keyText||!ivText||!route||!globalThis.crypto?.subtle||typeof TextEncoder==='undefined'||typeof TextDecoder==='undefined')return [];
    const response=await saltFetch(origin+'/'+route+'?id='+encodeURIComponent(fileId)+'&id='+encodeURIComponent(fileId),{headers:{Referer:actual,'X-Requested-With':'XMLHttpRequest'}});
    if(!response.ok)return [];
    const data=await response.json();
    let source=data.sources?.file;
    if(!source&&data.enc){
      const keyBytes=new Uint8Array(32),ivBytes=new Uint8Array(16);
      keyBytes.set(new TextEncoder().encode(keyText).subarray(0,32));ivBytes.set(new TextEncoder().encode(ivText).subarray(0,16));
      const key=await crypto.subtle.importKey('raw',keyBytes,{name:'AES-CBC'},false,['decrypt']);
      const raw=saltBase64(String(data.enc).replace(/-/g,'+').replace(/_/g,'/'));
      const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
      const decoded=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-CBC',iv:ivBytes},key,bytes)));
      source=decoded.file||decoded.url;
    }
    const url=saltUrl(source,actual);if(!url)return [];
    const headers={'Referer':origin+'/','Origin':origin,'User-Agent':SALT_UA};
    const media=await saltMedia(url,headers);if(!media||media.type!=='m3u8')return [];
    const master=await saltFetch(media.url,{headers});if(!master.ok)return [];
    const masterBody=(await master.text()).trim();if(!masterBody.startsWith('#EXTM3U')||!await saltValidateHls(master.url||media.url,headers,masterBody))return [];
    const subtitles=(data.tracks||[]).filter(track=>(track.kind==='captions'||track.kind==='subtitles')&&track.file).map(track=>({url:saltUrl(track.file,actual),name:track.label||'Subtitles',language:/^english/i.test(track.label||'')?'en':'und',headers})).filter(track=>track.url);
    return [Object.assign(media,{url:master.url||media.url,language:embed.language,label:embed.label,headers,subtitles})];
  }catch(_){return [];}
}
async function getStreams(id,mediaType='tv',season=1,episode=1) {
  try {const target=await saltMetadata(id,mediaType,episode);if(!target)return [];target.requestedSeason=Math.max(1,parseInt(season,10)||1);target.requestedEpisode=Math.max(1,parseInt(episode,10)||1);const catalog=await saltCatalog(target);if(!catalog)return [];const ep=await saltFindEpisode(catalog,target,target.requestedSeason);if(!ep)return [];Object.assign(target,ep);const r=await saltFetch(ep.url,{headers:saltHeaders(catalog.url)});if(!r.ok)return [];const actual=r.url||ep.url;if(new URL(actual).pathname.replace(/\/$/,'')!==new URL(ep.url).pathname.replace(/\/$/,''))return [];const html=await r.text();if(target.tv&&!saltPageLinks(html,actual,'series|anime').some(v=>saltNorm(v.slug)===saltNorm(catalog.slug)))return [];const embeds=saltEmbeds(html,actual),seen={},settled=await Promise.all(embeds.map(v=>saltResolve(v,target,actual,0,{}).catch(()=>[]))),out=[];for(const src of settled.flat()){if(out.some(v=>v.url===src.url&&v.language===src.language))continue;const audio=/multi-audio/i.test(src.label)?'Multi-Audio':src.language==='ja'?'SUB':src.language==='en'?'DUB':src.language==='und'?'Audio unspecified':src.language.toUpperCase();out.push({name:SALT_CONFIG.name+' | '+src.label+' ['+audio+']',title:target.titles[0]+(target.tv?' · S'+target.requestedSeason+' E'+target.requestedEpisode:''),url:src.url,type:src.type,quality:src.quality,language:src.language,provider:SALT_CONFIG.name,headers:src.headers,subtitles:src.subtitles});}return out;
  }catch(error){console.error('['+SALT_CONFIG.name+'] '+(error&&error.message||error));return [];}
}
module.exports={getStreams};globalThis.getStreams=getStreams;

async function saltValidateHls(url,headers,initialBody) {
  async function inspect(playlistUrl,suppliedBody,depth) {
    if(depth>4)return false;
    try {
      const response=suppliedBody==null?await saltFetch(playlistUrl,{headers,timeoutMs:10000}):null;
      if(response&&!response.ok)return false;
      const base=response&&response.url||playlistUrl;
      const body=(suppliedBody==null?await response.text():suppliedBody).trim();
      if(!body.startsWith('#EXTM3U'))return false;
      const lines=body.split(/\r?\n/).map(l=>l.trim()),variants=[];
      for(let i=0;i<lines.length;i++)if(lines[i].startsWith('#EXT-X-STREAM-INF:')) {
        const uri=lines.slice(i+1).find(l=>l&&!l.startsWith('#'));
        const size=/RESOLUTION=(\d+)x(\d+)/i.exec(lines[i]),bandwidth=/(?:^|,)BANDWIDTH=(\d+)/i.exec(lines[i].slice(18));
        if(uri)variants.push({uri,area:size?Number(size[1])*Number(size[2]):0,bandwidth:Number(bandwidth&&bandwidth[1])||0});
      }
      if(variants.length) {
        variants.sort((a,b)=>b.area-a.area||b.bandwidth-a.bandwidth);
        // CDN renditions fail independently. Check each candidate in order so
        // one failed rendition does not discard the whole master playlist.
        for(const variant of variants.slice(0,4))if(await inspect(new URL(variant.uri,base).href,null,depth+1))return true;
        return false;
      }
      const segments=lines.filter(l=>l&&!l.startsWith('#')).slice(0,2);
      if(!segments.length)return false;
      for(const uri of segments) {
        try {
          let segment=await saltFetch(new URL(uri,base).href,{headers:Object.assign({},headers,{Range:'bytes=0-1023'}),timeoutMs:10000});
          if(segment.status===400||segment.status===405||segment.status===416)
            segment=await saltFetch(new URL(uri,base).href,{headers,timeoutMs:10000});
          if(segment.ok&&!/text\/html|application\/json/i.test(segment.headers.get('content-type')||''))return true;
        }catch(_){}
      }
      return false;
    }catch(_){return false;}
  }
  return inspect(url,initialBody,0);
}
function saltHlsAudioTracks(playlist) {
  const tracks=[];
  for(const match of String(playlist||'').matchAll(/^#EXT-X-MEDIA:(.*)$/gim)) {
    const attrs=match[1],read=key=>{const found=attrs.match(new RegExp('(?:^|,)'+key+'="([^"]*)"','i'))||attrs.match(new RegExp('(?:^|,)'+key+'=([^,]*)','i'));return found&&found[1]?found[1].trim():'';};
    if(read('TYPE').toUpperCase()!=='AUDIO')continue;
    const name=read('NAME'),rawLanguage=read('LANGUAGE'),code=value=>SALT_LANGUAGE[value.toLowerCase().split(/[-_]/)[0]],language=code(rawLanguage)||code(name)||'und';
    const label=SALT_LANGUAGE_LABEL[language]||name||rawLanguage;
    if(label&&!tracks.some(track=>track.language===language&&track.label.toLowerCase()===label.toLowerCase()))tracks.push({language,label});
  }
  return tracks;
}
async function saltMyStream(html,actual,page,target,embed) {
  const content=saltUnpack(html);
  const match=content.match(/VPlayer\(\s*["']([a-z0-9]+)["']\s*,\s*(\{[\s\S]*?\})\s*,\s*(?:true|false)/i);
  if(!match)return null;
  let config;try{config=JSON.parse(match[2]);}catch(_){return [];}
  if(!config.title||!saltHostIdentity('<title>'+config.title+'</title>',target))return [];
  const endpoint=new URL('/player/index.php?data='+encodeURIComponent(match[1])+'&do=getVideo',actual).href;
  const headers=Object.assign(saltHeaders(actual),{'Content-Type':'application/x-www-form-urlencoded','X-Requested-With':'XMLHttpRequest'});
  const r=await saltFetch(endpoint,{method:'POST',headers,body:'hash='+encodeURIComponent(match[1])+'&r='+encodeURIComponent(page)});
  if(!r.ok)return [];const data=await r.json(),url=saltUrl(data.videoSource,actual);if(!url)return [];
  const mediaHeaders=saltHeaders(actual),master=await saltFetch(url,{headers:mediaHeaders});if(!master.ok)return [];
  const masterBody=(await master.text()).trim();if(!masterBody.startsWith('#EXTM3U'))return [];
  const media={url:master.url||url,type:'m3u8',quality:'Auto'};
  if(!await saltValidateHls(media.url,mediaHeaders,masterBody))return [];
  const subtitles=[];
  for(const track of config.tracks||[])if(track.kind==='captions'&&track.file){
    const trackUrl=saltUrl(track.file,actual);if(!trackUrl)continue;
    const sr=await saltFetch(trackUrl,{headers:mediaHeaders});
    if(sr.ok&&(await sr.text()).trimStart().startsWith('WEBVTT'))subtitles.push({url:trackUrl,name:track.label||track.language||'Subtitles',language:SALT_LANGUAGE[String(track.label||'').toLowerCase()]||track.language||'und',headers:mediaHeaders});
  }
  let language=embed.language,label=embed.label;
  if(media.type==='m3u8'){
    const body=masterBody;
    const tracks=saltHlsAudioTracks(body),server='MyStream';
    // Keep the full multi-audio label while exposing Hindi as the preferred track when present.
    if(tracks.length>1){language=tracks.some(track=>track.language==='hi')?'hi':'und';label=server+' · Multi-Audio ('+tracks.map(track=>track.label).join(', ')+')';}
    else if(tracks.length===1){language=tracks[0].language;label=server+' · '+tracks[0].label;}
  }
  return [Object.assign(media,{language,label,headers:mediaHeaders,subtitles})];
}
