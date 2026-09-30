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
