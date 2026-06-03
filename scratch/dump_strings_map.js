const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'strp2p_bundle.js');
const code = fs.readFileSync(bundlePath, 'utf8');

const arrayRegex = /const\s+i\s*=\s*(\[[\s\S]+?\]);/m;
const match = code.match(arrayRegex);
const i_array = eval(match[1]);

const mapping = {};
i_array.forEach((str, index) => {
  mapping[index + 131] = str;
});

fs.writeFileSync(path.join(__dirname, 'strings_map.json'), JSON.stringify(mapping, null, 2));
console.log("Successfully wrote strings_map.json!");
