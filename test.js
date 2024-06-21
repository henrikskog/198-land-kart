import fs from 'fs';

// read country-geojson-data-compressed.json

const data = fs.readFileSync('country-geojson-data-compressed.json', 'utf8');

const a = JSON.parse(data);
console.log(a);