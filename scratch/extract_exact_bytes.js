const axios = require('axios');

async function run() {
  const url = 'https://tioplus.app/player/Y0RJM1EyeHNNbmc0TTNSbFNtMDBhVVJ2Wm1KaFJGTVZkeEZ6ZWxCWGVENTFiR1JCTHpndmVWWndOMWhSTjZ0clBRPT0=';
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://tioplus.app/pelicula/los-looney-tunes-en-un-perfume-nunca-visto"
      },
      responseType: 'arraybuffer'
    });
    
    const buffer = Buffer.from(res.data);
    
    // Let's search for window.location.href in the raw buffer
    const prefix = Buffer.from("window.location.href = '");
    let startIndex = -1;
    for (let i = 0; i < buffer.length - prefix.length; i++) {
      let match = true;
      for (let j = 0; j < prefix.length; j++) {
        if (buffer[i + j] !== prefix[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        startIndex = i + prefix.length;
        break;
      }
    }
    
    if (startIndex !== -1) {
      // Find the closing single quote
      let endIndex = startIndex;
      while (endIndex < buffer.length && buffer[endIndex] !== 39) { // 39 is ASCII code for '
        endIndex++;
      }
      
      const rawBytes = [];
      for (let i = startIndex; i < endIndex; i++) {
        rawBytes.push(buffer[i]);
      }
      
      console.log("Raw Bytes extracted from player HTML:");
      console.log(rawBytes);
      console.log("Raw Bytes length:", rawBytes.length);
      
      const output = "https://vidhideplus.com/v/ux8r9hcmit2a";
      console.log("\nComparison with output:");
      for (let i = 0; i < Math.max(rawBytes.length, output.length); i++) {
        const inByte = rawBytes[i];
        const outChar = output[i];
        const outByte = outChar ? outChar.charCodeAt(0) : null;
        
        const diff = (inByte !== undefined && outByte !== null) ? (inByte - outByte) : null;
        const xor = (inByte !== undefined && outByte !== null) ? (inByte ^ outByte) : null;
        
        console.log(`[${i}] InByte: 0x${inByte ? inByte.toString(16).padStart(2, '0') : ''} (${inByte}) | OutByte: 0x${outByte ? outByte.toString(16).padStart(2, '0') : ''} (${outChar ? JSON.stringify(outChar) : ''}) | Diff: ${diff} | XOR: ${xor}`);
      }
    } else {
      console.log("Could not find window.location.href prefix in the raw buffer.");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
