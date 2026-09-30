# Playback evidence

Updated 2026-09-30. Listed adapters are not equivalent to verified site coverage.

| Adapter | Verified through Morrow's QuickJS runtime, local proxy and bundled Windows decoder | Limits |
| --- | --- | --- |
| Miruro | One Piece episode 1; Boruto episode 3 | Selected HLS sources only. Embed-only sources and the rendered HD-1 episode-switch flow need verification. |
| Anikage | One Piece episode 1 and Boruto episode 3, selected Japanese and English sources | Uses exact catalog identity and validates media responses. Plain TMDB seasons above 1 require anime episode mapping. Availability varies by server. |
| KickAssAnime | Attack on Titan episode 1, actual site HLS manifest, 1920×1080 decoded | HLS only; published multi-audio manifest retains the host's default track. DASH, plain IMDb input and unmapped later TMDB seasons are not supported yet. |
| AnimeSalt | Invalid HTML responses are rejected | Protected host extraction and playback remain unfinished. |
| Remaining catalog adapters | Not certified | Several existing scripts use a shared Anidap resolver. A catalog label does not prove a separate site's integration or playback. |

The Windows proxy omits Range for playlist routes that reject it, while retaining Range for media segments and direct files. Headless decoder tests do not certify the complete GUI flow or Android playback. No all-provider percentage has been established.
