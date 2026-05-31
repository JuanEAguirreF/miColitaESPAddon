const fs = require('fs');

// Implementation of VOE Decrypter Method 8 (Domkeykong)
function decryptVoeMethod8(obfuscatedStr) {
  // Step 3: Apply ROT13 to the obfuscated string.
  let rot13Str = rot13(obfuscatedStr);
  console.log("Step 3 (ROT13) sample:", rot13Str.substring(0, 100));

  // Step 4: Clean the following obfuscation markers: @$, ^^, ~@, %?, *~, !!, #&.
  const markers = [/@\$/, /\^\^/, /~@/, /%\?/, /\*~/, /!!/, /#&/];
  let cleanedStr = rot13Str;
  for (const marker of markers) {
    cleanedStr = cleanedStr.replace(new RegExp(marker, 'g'), '');
  }
  console.log("Step 4 (Cleaned) sample:", cleanedStr.substring(0, 100));

  // Step 5: Base64 decode the resulting string.
  let decodedBuffer = Buffer.from(cleanedStr, 'base64');
  console.log("Step 5 (Base64 Decoded) buffer length:", decodedBuffer.length);

  // Step 6: Perform a character shift (subtract 3 from each character's ASCII code point).
  let shiftedStr = '';
  for (let i = 0; i < decodedBuffer.length; i++) {
    shiftedStr += String.fromCharCode(decodedBuffer[i] - 3);
  }
  console.log("Step 6 (Character Shift) sample:", shiftedStr.substring(0, 100));

  // Step 7: Reverse the string.
  let reversedStr = shiftedStr.split('').reverse().join('');
  console.log("Step 7 (Reversed) sample:", reversedStr.substring(0, 100));

  // Step 8: Base64 decode a second time.
  let finalJsonStr = Buffer.from(reversedStr, 'base64').toString('utf8');
  console.log("Step 8 (Final Decoded String):", finalJsonStr);

  // Step 9: Parse the final JSON.
  const finalJson = JSON.parse(finalJsonStr);
  return finalJson;
}

function rot13(str) {
  return str.replace(/[a-zA-Z]/g, function(c) {
    return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
  });
}

// Let's load the obfuscated string from the script type="application/json" of voe_redirect.html
try {
  const html = fs.readFileSync('scratch/voe_redirect.html', 'utf8');
  const jsonScriptMatch = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
  if (jsonScriptMatch) {
    const jsonArr = JSON.parse(jsonScriptMatch[1]);
    const obfuscatedStr = jsonArr[0];
    console.log("Found obfuscated string length:", obfuscatedStr.length);
    const decrypted = decryptVoeMethod8(obfuscatedStr);
    console.log("Decrypted successfully!", decrypted);
  } else {
    console.error("Could not find script type='application/json' in voe_redirect.html");
  }
} catch (e) {
  console.error("Error running test:", e);
}
