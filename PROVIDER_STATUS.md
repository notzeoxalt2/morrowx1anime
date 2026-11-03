# Provider verification status

Updated 2026-11-03; Anime X1 1.8.9 is the current working-tree candidate. Stream discovery, valid manifests, decoded playback, and all-server coverage are different checks. These records describe the evidence actually obtained.

| Provider | Evidence / remaining work |
|---|---|
| HiAnime | Genuine hianime.at catalog and episode API. Oct 9 all eight returned ZokoAnime SUB/DUB sources for Attack on Titan E1, One Piece E1/E2, Boruto E3 decoded at 1080p through Morrow QuickJS, proxy and libmpv. Native subtitles preserved. HD-1/MegaPlay metadata resolves, but the media CDN returns HTTP 403 and is excluded. One Piece S1E1 DUB also rendered in the Windows app. Other rendered-app/phone checks remain pending. New hianime-site ID avoids reviving the retired alias. |
| AnimePahe | Legacy renamed Anidap route disabled; use genuine Anidap. Separate site integration not implemented or certified. |
| AnimeSalt | Nov 3: synced the season-aware desktop adapter into X1 1.8.9; Ben 10: Classic S4E13 now resolves the requested S4E13 route and returns MyStream plus a Hindi Abyss browser handoff. MyStream decoded at 1920×1080 through Morrow's local proxy and bundled libmpv. Naruto Shippuden S22E42 (site route E500) also returned the requested SUB/DUB labels and decoded at 1080p. Hindi is reported from exposed multi-audio metadata; Abyss is not direct in-app playback. Selected samples only, not all titles/servers. |
| AniDB | Legacy renamed Anidap route disabled; use genuine Anidap. Separate site integration not implemented or certified. |
| Anikage | Oct 9 actual IMDb series requests for One Piece S1E1/E2 returned 5/1 validated sources after excluding same-title movies from TV search. Prior selected One Piece/Boruto Koto sources decoded at 1080p. All server/audio/title combinations and later-season TMDB mapping are not certified. |
| AniKotoTV | Legacy renamed Anidap route disabled; use genuine Anidap. Separate site integration not implemented or certified. |
| Aniwaves | Legacy renamed Anidap route disabled; use genuine Anidap. Separate site integration not implemented or certified. |
| Anitaku | Legacy renamed Anidap route disabled; use genuine Anidap. Separate site integration not implemented or certified. |
| Miruro | Oct 9 actual IMDb series requests for One Piece S1E1/E2 returned 15/13 validated sources including SUB and DUB. Removed unsupported catalog episode-list dependency for season 1. Previous native decode evidence remains; later-season TMDB mapping and every server/title are not certified. |
| ReAnime | Actual catalog, episode, FlixCloud, and playlist transport. Oct 30 current-host Morrow runtime and bundled libmpv decoded Re:Zero S1E1, Re:Zero S4E3, and Attack on Titan S2E12 at 1080p. Handles title punctuation differences (such as `Re:ZERO` versus `ReZERO`), parses season/episode from release names without consuming adjacent resolution digits, supports exact-title rows with a missing AniList ID, rejects conflicting IDs, and deduplicates identical embed URLs before extraction. Three named samples only; every server/title is not certified. |
| AnimeHeaven | Actual site catalog/episode and MP4 integration. Nov 3: the downloadable adapter handles split installment pages and flat franchise pages; its Morrow QuickJS fixture tests pass. Live Attack on Titan S2E12 and S3 Part 2 E10 each returned 3 site-listed SUB choices; the RT route decoded at 1280×720 through Morrow's local proxy and bundled decoder for both. The other returned hosts were not decoded; other titles, episodes and CDNs are not certified. |
| Kurage | Legacy renamed Anidap route disabled; use genuine Anidap. Separate site integration not implemented or certified. |
| AnimeDekho | Legacy renamed Anidap route disabled; use genuine Anidap. Separate site integration not implemented or certified. |
| Anime Nexus | Legacy renamed Anidap route disabled; use genuine Anidap. Separate site integration not implemented or certified. |
| LunarX | Legacy renamed Anidap route disabled; use genuine Anidap. Separate site integration not implemented or certified. |
| SaltAnime | Nov 3: synced the season-aware desktop adapter into X1 1.8.9. Naruto Shippuden S22E42 (site route E500) returned the correct SUB label and decoded at 1080p through Morrow's proxy and bundled libmpv. Ben 10: Classic S4E13 route-matching and rejected-wrong-episode fixtures pass; the live cartoon check was made against AnimeSalt. Hindi is listed only when the selected MyStream exposes that audio track. Selected samples only, not all titles/servers. |
| KickAssAnime | Genuine HLS adapter delivered previously; selected playback tested. Every server and title not certified. |
| Anidap | Oct 9 exact One Piece E1 and Boruto E3 queries each returned 8 validated sources; selected Nero SUB decoded at 1080p through Morrow. |
| Anistream | Oct 9 actual site catalog/stream API returned 8 validated sources for each tested One Piece E1/Boruto E3 query; selected Nero SUB decoded at 1080p. |
| AnimeX | Oct 9 actual site catalog/stream API returned 8 validated sources for each tested One Piece E1/Boruto E3 query; selected Nero SUB decoded at 1080p. |
| AnimeParadise | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Xanime | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AniHQ | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Gotaku | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| ANIMEGG | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Animotvslash | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Lunar | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Just4Anime | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| 2Dhive | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AniWorld | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AniChan | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| HIDIVE | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Anikuro | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| bettermelon | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Kisskh | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| hianimes.se | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| animekai.ro | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| FireAnime | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Anime-Loads | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| WCO | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AnimeNoSub | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| KimoiTV | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Otaku-Streamers | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AV1 EnCodes | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Animo | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Zenkai | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AniLight | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| MeguAnimes | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Otakutsu | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| JustAnime | Actual catalog/episode/server API enabled. Oct 9 Morrow returned 18 One Piece E1 and 15 Boruto E3 media sources; selected Gigi SUB source decoded at 1080p for both. Every server/audio variant not certified. |
| Luna | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AniXo | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Animeyubi | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Kazora | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AniLast | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| YumeZone | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Itachi | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Kaori | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| LuffyTV | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Anikura | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| NekoWatch | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AnimeKizz | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Kyren | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| PimpAnime | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| megaplay.su | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Netflix | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| OceanVeil | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| RetroCrush | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Yomi | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Anime Silo | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| WatchAnimeX | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AniClipse | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| animeTVplus | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Onianime | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Kaizoku Anime | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Animegers | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AnimeDex | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Kawaii Anime | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| StreamX | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Sankanime | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| aniwavecomse | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| RamenFlix | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Hulu | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Animeya | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Enma | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Anime-Dunya | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| Kayoanimetv | Requested site catalogued; genuine native adapter not yet implemented or verified. |
| AnimeWorld | Requested site catalogued; genuine native adapter not yet implemented or verified. |
# October 9, version 1.8.1 playback recheck

All returned Boruto episode 3 choices decoded using Morrow's actual QuickJS plugin runtime, local HTTP proxy and bundled libmpv: Miruro 12/12, Anikage 4/4, Anidap 5/5. Miruro HD-1 SUB and DUB decoded at 1080p after image-wrapped MPEG-TS transport was corrected in Desktop 0.1.34 / Android 0.4.32.

The adapters now check the first media segment, including request headers. Routes with inaccessible segments are omitted rather than advertised as playable. This check does not guarantee every segment, quality, encryption key or device. Counts can vary with host availability. No certification of every requested integration is implied.

# November 3, AnimeHeaven season routing recheck

Compared the downloadable X1 adapter against the desktop implementation in Morrow's real QuickJS runtime. Before the update, the downloadable adapter failed both a split-season routing fixture and the flat-franchise absolute-episode fixture. After syncing the mixed-page routing logic and declaring AniList-entry episode numbering, both Morrow fixture tests passed. Live site checks returned three SUB choices for Attack on Titan S2E12 and three for S3 Part 2 E10; the RT route decoded for both at 1280×720 using Morrow's local proxy and bundled Windows decoder. This confirms those two coordinates and one host route each, not every AnimeHeaven server/title or Android playback.
