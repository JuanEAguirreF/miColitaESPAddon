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
    const html = buffer.toString('utf8');
    
    // Find the string in window.location.href = '...'
    const match = html.match(/window\.location\.href\s*=\s*'([^']+)'/);
    if (match) {
      const matchStr = match[1];
      console.log("Match string:", matchStr);
      const matchStart = html.indexOf(matchStr);
      const subBuffer = buffer.slice(matchStart, matchStart + matchStr.length);
      console.log("Match bytes (hex):", subBuffer.toString('hex'));
      
      // Let's see if there is some XOR or shift decryption we can deduce!
      // 'httxs:/#vidhi...' -> usually 'https://vidhide...' or 'https://...'
      // Let's compare 'httxs:/#vidhi' and 'https://vidhi'
      // Character 0: 'h' (hex 68) -> 'h' (hex 68)
      // Character 1: 't' (hex 74) -> 't' (hex 74)
      // Character 2: 't' (hex 74) -> 't' (hex 74)
      // Character 3: 'x' (hex 78) -> 'p' (hex 70)
      // Character 4: 's' (hex 73) -> 's' (hex 73)
      // Character 5: ':' (hex 3a) -> ':' (hex 3a)
      // Character 6: '/' (hex 2f) -> '/' (hex 2f)
      // Character 7: '#' (hex 23) -> '/' (hex 2f)
      // Character 8: 'v' (hex 76) -> 'v' (hex 76)
      // Character 9: 'i' (hex 69) -> 'i' (hex 69)
      // Character 10: 'd' (hex 64) -> 'd' (hex 64)
      // Character 11: 'h' (hex 68) -> 'h' (hex 68)
      // Character 12: 'i' (hex 69) -> 'i' (hex 69)
      
      // Look at the differences:
      // Index 3: 'x' (120) vs 'p' (112) -> diff is -8, or XOR?
      // Index 7: '#' (35) vs '/' (47) -> diff is +12, or XOR?
      // Let's print out the character codes of matchStr and see what XOR or shift or mapping they did!
      const targetStrStart = "https://vidhi"; // target could be https://vidhide.to/ or https://vidhidepre.com/ or https://vidhide.com/ or https://vidhide.net/ or hlswish.com or streamwish
      console.log("\nCharacter comparison:");
      for (let i = 0; i < matchStr.length; i++) {
        const code = matchStr.charCodeAt(i);
        const hex = code.toString(16).padStart(2, '0');
        console.log(`[${i}] Char: ${matchStr[i]} (code: ${code}, hex: 0x${hex})`);
      }
    } else {
      console.log("Could not find window.location.href match in HTML.");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
