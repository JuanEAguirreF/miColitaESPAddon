const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'strp2p_bundle.js');
const code = fs.readFileSync(bundlePath, 'utf8');

// Find all matches for "x="
const matches = [];
let index = 0;
while (true) {
  index = code.indexOf("x=", index);
  if (index === -1) break;
  matches.push(index);
  index += 2;
}

console.log("Found matches for x= at indices:", matches);
matches.forEach(idx => {
  console.log(`Context at index ${idx}:`);
  console.log(code.substring(idx - 100, idx + 300));
  console.log("-----------------------------------------");
});
