<p align="center"><img src="assets/morrow-wordmark.png" alt="Morrow" width="360"></p>

# Morrow Anime X1

Source adapters for the Morrow player. X1 combines the previous Anime 1 and Anime 2 catalogs.

## Install

In Morrow, open **Settings → Providers → Install Morrow Providers**. For manual installation, add this repository’s raw `manifest.json` URL.

## Catalog

- HiAnime
- AnimePahe
- AnimeSalt
- AniDB
- Anikage
- KickAssAnime (HLS)
- AniKotoTV
- Aniwaves
- Anitaku
- Miruro
- ReAnime
- AnimeHeaven
- Kurage
- AnimeDekho
- Anime Nexus
- LunarX
- SaltAnime

## Playback status

A catalog entry is not a guarantee of playback. Each adapter must resolve the selected title and episode, return media rather than an HTML embed, and retain the source’s required request headers. Site availability and stream tokens can change. Current validation findings are recorded in `PROVIDER_STATUS.md` where present.

## Development

Providers export `getStreams(id, mediaType, season, episode)`. Return direct media URLs, actual quality and audio metadata, subtitle tracks, and required request headers. Do not relabel another provider’s results as site-specific sources.

## Runtime update

Version 1.8 adds genuine Anidap, Anistream and AnimeX adapters and replaces ReAnime/AnimeHeaven extraction with their actual site paths. ReAnime encoded playlists require Morrow Desktop 0.1.33 or Android 0.4.31. See PROVIDER_STATUS.md for tested samples and blocked hosts.

Legacy scripts that queried Anidap while using other site names are disabled in 1.8.0. Their real routes are consolidated under Anidap with exact catalog/episode checks. Separate integrations remain tracked in PROVIDER_STATUS.md.
