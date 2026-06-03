const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'strp2p_bundle.js');
const code = fs.readFileSync(bundlePath, 'utf8');

const target = 'ᵟ';
const idx = code.indexOf(target);
if (idx !== -1) {
  console.log("Context around ᵟ in minified bundle:");
  console.log(code.substring(idx - 100, idx + 500));
} else {
  console.log("Could not find ᵟ");
}
