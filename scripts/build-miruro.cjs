const fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..');
const gzip=fs.readFileSync(path.join(base,'vendor/fflate.js'),'utf8');
const adapter=fs.readFileSync(path.join(base,'src/miruro.js'),'utf8');
fs.writeFileSync(path.join(base,'providers/miruro.js'),'// Morrow Miruro adapter. Bundled fflate: see vendor/fflate-LICENSE.\nconst morrowGzip=(function(){var module={exports:{}},exports=module.exports;\n'+gzip+'\nreturn module.exports;})();\n'+adapter);
console.log('Built standalone Miruro script for Morrow QuickJS.');
