const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/catalog-rest-anime.js'), 'utf8');
const configs = {
    anidap: { name: 'Anidap', origin: 'https://anidap.lol', api: 'https://chad.anidap.lol/rest/api' },
    anistream: { name: 'Anistream', origin: 'https://anistream.one', graphql: 'https://graphql.animex.one/graphql', api: 'https://api.anistream.one/rest/api' },
    animex: { name: 'AnimeX', origin: 'https://animex.one', graphql: 'https://graphql.animex.one/graphql', api: 'https://pp.animex.one/rest/api' },
};
for (const [id, config] of Object.entries(configs)) {
    fs.writeFileSync(path.join(root, 'providers', id + '.js'), source.replace('__SITE_CONFIGURATION__', JSON.stringify(config)));
}
console.log('Built Anidap, Anistream and AnimeX with their published site APIs.');
