const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'strp2p_bundle.js');
const code = fs.readFileSync(bundlePath, 'utf8');

// The string array is returned by pn()
const arrayMatch = code.match(/const\s+i\s*=\s*(\[[\s\S]+?\]);/m);
const i_array = eval(arrayMatch[1]);

function pn() {
  return i_array;
}

function j(n, s) {
  const t = pn();
  j = function(n, s) {
    n = n - 131;
    return t[n];
  };
  return j(n, s);
}

// Find rotation IIFE starting with "(function(i,e){"
const searchStr = "(function(i,e){";
const startIndex = code.indexOf(searchStr);
if (startIndex === -1) {
  console.error("Could not find start of rotation IIFE");
  process.exit(1);
}

// Find the call boundary: find the matching function paren, and then search for the end semicolon.
let parenCount = 0;
let funcEndIndex = -1;
for (let idx = startIndex; idx < code.length; idx++) {
  if (code[idx] === '(') {
    parenCount++;
  } else if (code[idx] === ')') {
    parenCount--;
    if (parenCount === 0) {
      funcEndIndex = idx;
      break;
    }
  }
}

if (funcEndIndex === -1) {
  console.error("Could not find funcEndIndex");
  process.exit(1);
}

// Find the semicolon after the call (pn, 529585);
const callEndIndex = code.indexOf(';', funcEndIndex);
const iifeCode = code.substring(startIndex, callEndIndex + 1);

console.log("Extracted COMPLETE IIFE code:");
console.log(iifeCode.substring(0, 150) + " ... " + iifeCode.substring(iifeCode.length - 150));

// Run the rotation IIFE!
eval(iifeCode);

// Dump rotated strings
const mapping = {};
i_array.forEach((str, index) => {
  mapping[index + 131] = str;
});

fs.writeFileSync(path.join(__dirname, 'strings_map_rotated_fixed.json'), JSON.stringify(mapping, null, 2));
console.log("Successfully wrote strings_map_rotated_fixed.json!");
