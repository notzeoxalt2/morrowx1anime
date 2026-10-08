<p align="center"><img src="assets/morrow-wordmark.png" alt="Morrow" width="360"></p>

# Morrow Anime X1

Source adapters for the Morrow player. X1 combines the previous Anime 1 and Anime 2 catalogs.

## Install

In Morrow, open **Settings → Providers → Install Morrow Providers**. For manual installation, add this repository’s raw `manifest.json` URL.

## Catalog and playback

- Anikage
- Miruro
- ReAnime
- AnimeHeaven
- Anidap
- Anistream
- AnimeX
- JustAnime

These adapters have selected native playback evidence. The catalog also contains adapters still under investigation:

- AnimeSalt
- SaltAnime
- KickAssAnime

Retired aliases that fetched Anidap under unrelated site names are disabled. The complete requested-site list and unresolved work are in `PROVIDER_STATUS.md`.

## Playback status

A catalog entry is not a guarantee of playback. Each adapter must resolve the selected title and episode, return media rather than an HTML embed, and retain the source’s required request headers. Site availability and stream tokens can change. Current validation findings are recorded in `PROVIDER_STATUS.md` where present.

## Development

Providers export `getStreams(id, mediaType, season, episode)`. Return direct media URLs, actual quality and audio metadata, subtitle tracks, and required request headers. Do not relabel another provider’s results as site-specific sources.

## Runtime update

Version 1.8 adds genuine Anidap, Anistream and AnimeX adapters and replaces ReAnime/AnimeHeaven extraction with their actual site paths. ReAnime encoded playlists require Morrow Desktop 0.1.33 or Android 0.4.31. See PROVIDER_STATUS.md for tested samples and blocked hosts.

Legacy scripts that queried Anidap while using other site names are disabled in 1.8.0. Their real routes are consolidated under Anidap with exact catalog/episode checks. Separate integrations remain tracked in PROVIDER_STATUS.md.

Version 1.8.1 checks the first HLS media segment before returning Miruro, Anikage and catalog REST streams. Some inaccessible server routes therefore return no choice. Miruro HD-1 image-wrapped transport segments require Morrow Desktop 0.1.34 or Android 0.4.32.

Version 1.8.2 restores HiAnime using its actual catalog and episode API under a new `hianime-site` ID. Eight ZokoAnime SUB/DUB sources for Attack on Titan episode 1, One Piece episodes 1/2, and Boruto episode 3 decoded at 1080p through Morrow's runtime and proxy. HiAnime HD-1 metadata resolves, but its CDN returned HTTP 403 in these checks and those inaccessible streams are excluded. Visible desktop and physical phone checks are still pending.

On October 9, all 21 returned Boruto episode 3 choices from Miruro (12), Anikage (4) and Anidap (5) decoded through Morrow's actual plugin runtime, proxy and Windows player. This includes Miruro HD-1 SUB and DUB. This is sample evidence; it does not certify every title, server or device.
