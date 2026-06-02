const input = "httxs:/#vidhi\x15\xef\xbf\xbd\x0eL\x09\xef\xbf\xbd\xef\xbf\xbd*a\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbdT\xef\xbf\xbd\xef\xbf\xbdR6\xef\xbf\xbd\xef\xbf\xbd\x12";
const output = "https://vidhideplus.com/v/ux8r9hcmit2a";

// Let's print out the character codes of both and look for a pattern
console.log("Input length:", input.length);
console.log("Output length:", output.length);

console.log("\nComparison table:");
for (let i = 0; i < Math.max(input.length, output.length); i++) {
  const inChar = input[i];
  const inCode = inChar ? inChar.charCodeAt(0) : null;
  const outChar = output[i];
  const outCode = outChar ? outChar.charCodeAt(0) : null;
  
  const diff = (inCode !== null && outCode !== null) ? (inCode - outCode) : null;
  const xor = (inCode !== null && outCode !== null) ? (inCode ^ outCode) : null;
  
  console.log(`[${i}] In: ${inChar ? JSON.stringify(inChar) : 'None'} (0x${inCode ? inCode.toString(16) : ''}) | Out: ${outChar ? JSON.stringify(outChar) : 'None'} (0x${outCode ? outCode.toString(16) : ''}) | Diff: ${diff} | XOR: ${xor}`);
}
