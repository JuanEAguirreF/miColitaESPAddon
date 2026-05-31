const axios = require('axios');
const fs = require('fs');

async function run() {
  const url = 'https://voe.sx/e/c8wkr17jgi9y';
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Referer": "https://lamovie.org/"
  };

  try {
    const res = await axios.get(url, { headers, timeout: 10000 });
    const html = res.data;
    console.log("HTML cargado, tamaño:", html.length);
    fs.writeFileSync('scratch/voe_page.html', html);
    console.log("Guardado HTML en scratch/voe_page.html");

    // Buscar si hay redirección de window.location
    const redirectMatch = html.match(/window\.location\.href\s*=\s*['"](https?:\/\/[^'"]+)['"]/i);
    console.log("Redirect match:", redirectMatch ? redirectMatch[1] : "No");

    // Buscar cualquier ocurrencia de .mp4 o .m3u8 en texto
    const m3u8s = html.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/gi);
    console.log("M3U8s encontrados:", m3u8s);
    
    const mp4s = html.match(/(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/gi);
    console.log("MP4s encontrados:", mp4s);

    // Buscar Base64 o URL codificadas en variables script
    const scripts = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi) || [];
    console.log("Cantidad de scripts:", scripts.length);
    
    for (const scr of scripts) {
      if (scr.includes('404') || scr.includes('hls') || scr.includes('sources') || scr.includes('var ') || scr.includes('eval')) {
        console.log("\nScript interesante encontrado:", scr.substring(0, 400) + "...");
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
