const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'strp2p_bundle.js');
const code = fs.readFileSync(bundlePath, 'utf8');

const arrayRegex = /const\s+i\s*=\s*(\[[\s\S]+?\]);/m;
const match = code.match(arrayRegex);
const i_array = eval(match[1]);

console.log("i_array length:", i_array.length);
i_array.forEach((str, index) => {
  const codeIndex = index + 131;
  if (str === "3579" || str === "referrer" || str.includes("ITWM") || str === "AES-CBC") {
    console.log(`[${codeIndex}] -> "${str}"`);
  }
});
