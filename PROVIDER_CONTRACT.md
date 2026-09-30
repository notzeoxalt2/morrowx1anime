# Morrow provider contract

Morrow loads a repository manifest, downloads each scraper's JavaScript, and runs it in its embedded QuickJS runtime. A page working in Chrome does not establish that its adapter works in Morrow.

## Repository manifest

A repository has `name`, `version`, `description`, and a `scrapers` array. Each scraper needs its stable `id`, `name`, `version`, relative `filename`, `supportedTypes`, and `enabled` state. Relative script filenames resolve against the manifest directory. Keep existing scraper IDs stable during updates so user preferences survive.

## Entry point

```js
module.exports.getStreams = async function(id, mediaType, season, episode) {
  return [{
    name: 'Site | Actual server [SUB] · 720p',
    title: 'Actual show · S1 E7',
    url: 'https://media.example/7/master.m3u8',
    type: 'm3u8',
    quality: '720p',
    language: 'ja',
    provider: 'Site',
    headers: { Referer: 'https://site.example/' },
    subtitles: [{
      url: 'https://media.example/7/en.vtt',
      language: 'en', name: 'English',
      headers: { Referer: 'https://site.example/' }
    }]
  }];
};
```

The repository resolves the incoming media identifier through `TmdbService.ensureTmdbId` before invoking the adapter. Anime is normalized to `tv` when season/episode is present, otherwise `movie`. The runtime calls `getStreams(id, mediaType, season, episode)` with missing episode values as `undefined`. Do not interpret the numeric ID as an AniList ID or the episode as an absolute episode number.

`globalThis.TMDB_API_KEY` is supplied by Morrow's configured metadata key. Fetch, URL, crypto, text encoding, timers, and DOM helpers are supplied by Morrow. Do not depend on Node `fs`, browser navigation, or a real browser `document`.

Return a JSON-serializable array. Required playback field: `url`. Morrow reads `title`, `name`, `quality`, `language`, `provider`, `type`, `headers`, and `subtitles` (subtitle `url`, `language`, `name`, `headers`). Return actual media sources, not an HTML embed labeled `m3u8`. Return an empty array if content identity is ambiguous or the requested episode is unavailable.

## Binary APIs and playback

The updated Android/desktop HTTP bridge preserves application/octet-stream bytes as base64 and exposes `response.arrayBuffer()`. Miruro's current catalog requires binary XOR and gzip decoding; the previous text-only bridge corrupted those bytes. The adapter bundles fflate, with its MIT notice in `vendor/fflate-LICENSE`.

Header-dependent media is routed through Morrow's local proxy at initial playback and when selecting another source or episode. The proxy rewrites playlist children, audio/subtitle URI attributes, and keys, and preserves media byte ranges. Subtitle headers remain part of the subtitle result.

## Evidence

Desktop test `MorrowProviderContractTest` runs the built Miruro script inside Morrow's actual runtime. A binary fixture distinguishes Naruto from Naruto Shippuden and rejects episode 7 when episode 8 was requested. The opt-in live test uses Morrow's own metadata configuration and checks Attack on Titan SUB/DUB results, including a split anime season.

```powershell
$env:MORROW_MIRURO_SCRIPT = 'E:\IDm\Compressed\morrowx1anime-repository\providers\miruro.js'
$env:MORROW_LIVE_PROVIDER_TEST = '1'
.\gradlew.bat :composeApp:desktopTest --tests '*MorrowProviderContractTest' --no-build-cache
```

Live source retrieval, media decoding, and playback on a physical Android device are separate verification steps. A successful provider contract test does not certify every returned server's playback.

## Anime catalog IDs and absolute episodes (Morrow desktop 0.1.31-alpha / mobile 0.4.27)

Morrow now preserves namespaces for AniList, MAL and Kitsu IDs and maps them through AniZip to the metadata ID expected by existing adapters. It additionally supplies optional global MORROW_MEDIA_CONTEXT with originalId, anilistId, animeEpisode and animeTitle. The getStreams signature is unchanged. An adapter can use the explicit anime identity and anime-relative episode rather than assuming an anime catalog episode is TMDB S1 E[number]. Miruro uses this context and refuses a different AniList identity.

A null final episode count denotes an ongoing show, not zero available episodes. Missing future-episode translations no longer invalidate an entire mapping response. TMDB episode names can differ from site translations; the Miruro fallback uses a unique air date within the same verified show ID, preferring exact dates and then matching titles when there is ambiguity.

Verified live examples through PluginRepository -> conversion -> QuickJS: anilist:21 and kitsu:12 -> One Piece E1 (15 sources); mal:34566 -> Boruto E3 (13/14 sources depending on current server availability). A source for each show decoded through the actual Morrow desktop proxy and bundled libmpv: One Piece 1440x1080, Boruto 1920x1080. This does not certify every provider/server.

AnimeSalt now rejects HTML embeds and unknown quality instead of presenting them as 1080p HLS. Its protected host extraction is still pending. Native fallback providers are skipped when an enabled installed adapter with the same provider name is present, preventing older results from replacing the updated adapter's group.
