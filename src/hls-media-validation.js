// Validate the actual first media route, not just an accessible master playlist.
async function morrowMediaFetch(url, options) {
  let timer;
  try {
    return await Promise.race([fetch(url, options), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Media validation timeout')), 3500);
    })]);
  } finally { if (timer) clearTimeout(timer); }
}
async function morrowAccessibleHls(url, headers, playlist) {
  try {
    let base = url, body = playlist;
    for (let depth = 0; depth < 4; depth++) {
      if (!body) {
        const response = await morrowMediaFetch(base, {headers});
        if (!response.ok) return false;
        body = await response.text();
        base = response.url || base;
      }
      if (!body.trimStart().startsWith('#EXTM3U')) return false;
      const lines = body.split(/\r?\n/).map(line => line.trim());
      const variants = [];
      for (let i=0; i<lines.length; i++) if (lines[i].startsWith('#EXT-X-STREAM-INF:')) {
        const resolution = /RESOLUTION=(\d+)x(\d+)/i.exec(lines[i]);
        const bandwidth = /(?:^|,)BANDWIDTH=(\d+)/i.exec(lines[i].slice(18));
        const uri = lines.slice(i+1).find(line => line && !line.startsWith('#'));
        if (uri) variants.push({uri,area:resolution?Number(resolution[1])*Number(resolution[2]):0,bitrate:Number(bandwidth?.[1])||0});
      }
      if (variants.length) {
        variants.sort((a,b) => b.area-a.area || b.bitrate-a.bitrate);
        base = new URL(variants[0].uri, base).href; body = null; continue;
      }
      const media = lines.find(line => line && !line.startsWith('#'));
      if (!media) return false;
      const mediaUrl = new URL(media, base).href;
      let response = await morrowMediaFetch(mediaUrl, {headers:{...headers,Range:'bytes=0-1023'}});
      if (response.status === 400 || response.status === 416)
        response = await morrowMediaFetch(mediaUrl, {headers});
      const contentType = response.headers.get('content-type') || '';
      return response.ok && !/text\/html|application\/json/i.test(contentType);
    }
  } catch (_) { return false; }
  return false;
}
