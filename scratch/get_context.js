const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'strp2p_bundle.js');
const code = fs.readFileSync(bundlePath, 'utf8');

const targetStr = "importKey";
const index = code.indexOf(targetStr);
if (index !== -1) {
  console.log("Found importKey at index:", index);
  console.log("Context around it:");
  console.log(code.substring(index - 200, index + 300));
} else {
  console.log("Could not find importKey in the minified bundle");
}
