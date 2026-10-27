const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const episodeHtml = (numbers) => numbers
  .map(number => `<a href="/episode/one-piece-2x${number}">Episode ${number}</a>`)
  .join('');

function loadProvider(filename, mediaContext) {
  const sandbox = vm.createContext({
    module: { exports: {} },
    fetch: async () => { throw new Error('network is not used in this test'); },
    URL,
    setTimeout,
    clearTimeout,
    console,
  });
  sandbox.MORROW_MEDIA_CONTEXT = mediaContext;
  const source = fs.readFileSync(path.join(root, 'providers', filename), 'utf8');
  vm.runInContext(`${source}\nglobalThis.__test = { saltMetadata, saltEpisode };`, sandbox, { filename });
  return sandbox.__test;
}

for (const provider of ['animesalt.js', 'saltanime.js']) {
  test(`${provider} resolves season-local E1 to a site's globally numbered S2E62`, async () => {
    const helpers = loadProvider(provider, {
      animeTitle: 'One Piece',
      animeEpisodeNumbering: 'season-local',
      animeEpisode: 1,
      animeSeasonEpisode: 1,
      animeEpisodeAbsolute: 62,
    });
    const target = await helpers.saltMetadata('anilist:21', 'tv', 1);
    const selected = helpers.saltEpisode(
      { html: episodeHtml([62, 63]), url: 'https://animesalt.cx/series/one-piece', slug: 'one-piece' },
      target,
      2,
    );

    assert.equal(target.absolute, null);
    assert.equal(target.relativeEpisode, 1);
    assert.equal(selected.sourceSeason, 2);
    assert.equal(selected.sourceEpisode, 62);
  });

  test(`${provider} refuses a later episode when a season catalog has a gap`, async () => {
    const helpers = loadProvider(provider, {
      animeTitle: 'One Piece',
      animeEpisodeNumbering: 'season-local',
      animeEpisode: 2,
      animeSeasonEpisode: 2,
    });
    const target = await helpers.saltMetadata('anilist:21', 'tv', 2);
    const selected = helpers.saltEpisode(
      { html: episodeHtml([62, 64]), url: 'https://animesalt.cx/series/one-piece', slug: 'one-piece' },
      target,
      2,
    );

    assert.equal(selected, null);
  });
}
