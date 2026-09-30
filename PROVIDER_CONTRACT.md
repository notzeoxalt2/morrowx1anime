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
