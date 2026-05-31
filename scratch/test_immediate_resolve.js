const { resolveEmbedUrl } = require('../api/scraper/download.service');
const axios = require('axios');

async function run() {
  const embedUrl = 'https://vimeos.net/embed-s262fikwk6wz.html';
  console.log("Resolviendo embed inmediatamente...");
  const directUrl = await resolveEmbedUrl(embedUrl);
  console.log("URL Directa obtenida:", directUrl);
  
  if (!directUrl) {
    console.log("No se pudo resolver.");
    return;
  }

  console.log("\n1. Probando GET a URL directa sin referer...");
  try {
    const res = await axios.get(directUrl, { timeout: 5000 });
    console.log("¡Éxito sin referer! Status:", res.status, "Length:", res.data.length);
  } catch (e) {
    console.log("Fallo sin referer. Status:", e.response ? e.response.status : e.message);
  }

  console.log("\n2. Probando GET con Referer: https://vimeos.net/ ...");
  try {
    const res = await axios.get(directUrl, {
      headers: {
        "Referer": "https://vimeos.net/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 5000
    });
    console.log("¡Éxito con referer! Status:", res.status, "Length:", res.data.length);
  } catch (e) {
    console.log("Fallo con referer. Status:", e.response ? e.response.status : e.message);
  }
}

run();
