const axios = require('axios');
const fs = require('fs');

async function run() {
  const url = 'https://rebeccacostthousand.com/e/c8wkr17jgi9y';
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Referer": "https://lamovie.org/"
  };

  try {
    const res = await axios.get(url, { headers, timeout: 10000 });
    const html = res.data;
    console.log("Redirect HTML cargado, tamaño:", html.length);
    fs.writeFileSync('scratch/voe_redirect.html', html);

    // Buscar m3u8 o mp4 en texto
    const m3u8Match = html.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
    console.log("M3U8 match:", m3u8Match ? m3u8Match[1] : "No");

    const mp4Match = html.match(/(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i);
    console.log("MP4 match:", mp4Match ? mp4Match[1] : "No");

    // Buscar si hay variables interesantes o codificaciones Base64
    const base64Match = html.match(/['"]([A-Za-z0-9+/=]{40,})['"]/g);
    if (base64Match) {
      console.log("Base64 candidates found:", base64Match.length);
      for (const b of base64Match.slice(0, 5)) {
        try {
          const clean = b.replace(/['"]/g, '');
          const decoded = Buffer.from(clean, 'base64').toString('utf8');
          if (decoded.includes('http')) {
            console.log("Decoded Base64 URL:", decoded);
          }
        } catch(e){}
      }
    }

    // Buscar scripts con sources en JSON u otros
    const scripts = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
    for (const scr of scripts) {
      if (scr.includes('sources') || scr.includes('hls') || scr.includes('JSON.parse') || scr.includes('atob')) {
        console.log("\nScript interesante en página de redirección:", scr.substring(0, 800) + "...");
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
