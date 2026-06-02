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
    const html = buffer.toString('binary'); // read as binary string to preserve raw bytes
    
    // Find the string in window.location.href = '...'
    const match = html.match(/window\.location\.href\s*=\s*'([^']+)'/);
    if (match) {
      const matchStr = match[1];
      console.log("Match string length:", matchStr.length);
      console.log("Match string:");
      
      const charCodes = [];
      for (let i = 0; i < matchStr.length; i++) {
        charCodes.push(matchStr.charCodeAt(i));
      }
      console.log(charCodes);
      
      // Let's see if we can decode this string!
      // Is there a simple cipher? Let's check character subtraction, XOR, etc.
      // Usually, there is a JavaScript decryption function inside the page or loaded.
      // Wait, is there any other javascript on the player page? No, we saw the full page.
      // Let's check the inline script above:
      // (()=>{var f='Chmaorr...
      // Wait! Could that obfuscated script (which looks like a Cloudflare or custom anti-debugger script) be the one decrypting the window.location.href, or does the window.location.href ALREADY contain the encrypted string and the script decrypts it?
      // Wait! In the script:
      // window.onload = function() {
      //   message.innerHTML = 'Generando un nuevo enlace para ti...';
      //   setTimeout(() => {
      //     window.location.href = 'httxs:/#vidhi ...'
      //   }, 250);
      // }
      // This is a direct script! It sets window.location.href directly to that string!
      // But wait! If it sets it to that string, then the browser would try to navigate to that EXACT string!
      // If the string starts with `httxs:/#vidhi...`, that is not a valid URL! Or maybe it is resolved or intercepted?
      // Wait! Can a browser navigate to `httxs:/#vidhi...`? No, unless there is a service worker or something that intercepts it, or unless the page has some JS that overrides `window.location`!
      // Wait! Does `tioplus_app.js` or `tioplus_l.js` or `tioplus_m.js` override `window.location`?
      // Let's search `tioplus_m.js` or `tioplus_l.js` for `location` or `href` or `window.location`.
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
