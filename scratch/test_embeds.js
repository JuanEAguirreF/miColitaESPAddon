const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const HTTP_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
};

async function testFetchEmbed(url) {
  console.log(`\n--------------------------------------------------`);
  console.log(`PROBANDO EMBED VIA AXIOS: ${url}`);
  console.log(`--------------------------------------------------`);
  try {
    const response = await axios.get(url, {
      headers: {
        ...HTTP_HEADERS,
        "Referer": "https://lamovie.org/"
      },
      timeout: 10000
    });
    
    const html = response.data;
    console.log(`Axios cargó HTML de tamaño: ${html.length} bytes`);
    
    // Buscar patrones comunes de video (.m3u8, .mp4, jwplayer, etc.)
    const m3u8Match = html.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
    if (m3u8Match) {
      console.log(`[AXIOS SUCCESS] Encontrado .m3u8 directo:`, m3u8Match[1]);
    } else {
      console.log(`[AXIOS INFO] No se encontró .m3u8 directo. Buscando fuentes en scripts...`);
    }

    const fileMatches = html.match(/(?:file|src|url)\s*:\s*["'](https?:\/\/[^"']+)["']/gi);
    if (fileMatches) {
      console.log(`[AXIOS INFO] Coincidencias de 'file/src/url':`, fileMatches.slice(0, 5));
    }
    
    // Buscar enlaces en script eval (packer)
    if (html.includes('eval(function(p,a,c,k,e,d)')) {
      console.log(`[AXIOS INFO] Contiene JS Packed (eval).`);
    }
  } catch (e) {
    console.log(`[AXIOS ERROR] Falló la petición:`, e.message);
  }
}

async function testPuppeteerEmbed(url) {
  console.log(`\n--------------------------------------------------`);
  console.log(`PROBANDO EMBED VIA PUPPETEER: ${url}`);
  console.log(`--------------------------------------------------`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  await page.setExtraHTTPHeaders({ "Referer": "https://lamovie.org/" });

  let videoUrls = [];
  page.on('request', req => {
    const rUrl = req.url();
    if ((rUrl.includes('.m3u8') || rUrl.includes('.mp4')) && !rUrl.startsWith("blob:") && !rUrl.includes("blank") && !videoUrls.includes(rUrl)) {
      videoUrls.push(rUrl);
      console.log(`[INTERCEPTADO] -> ${rUrl.substring(0, 150)}`);
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    console.log("Cargado. Esperando interacción...");
    
    // Intentar hacer clic en el reproductor para disparar la carga del video
    try {
      await page.mouse.click(640, 360);
      console.log("Clic general en el centro realizado.");
    } catch (err) {}
    
    await new Promise(r => setTimeout(r, 6000));
    
    console.log(`Video URLs interceptadas para ${url}:`, videoUrls);
    
    if (videoUrls.length === 0) {
      // Buscar en el DOM
      const videoSrc = await page.evaluate(() => {
        const video = document.querySelector('video');
        return video ? video.src : null;
      });
      console.log("Video src en DOM:", videoSrc);
    }
  } catch (e) {
    console.error("Error en Puppeteer:", e.message);
  } finally {
    await browser.close();
  }
}

async function run() {
  const embeds = [
    "https://vimeos.net/embed-svuqfvt7ffzq.html",
    "https://goodstream.one/embed-xqm9zlepsygr.html",
    "https://hlswish.com/e/dernlb8lq2le"
  ];
  
  // Probar Axios primero para ver si podemos extraerlo súper liviano
  for (const embed of embeds) {
    await testFetchEmbed(embed);
  }
  
  // Probar Puppeteer como fallback para intercepción
  for (const embed of embeds) {
    await testPuppeteerEmbed(embed);
  }
}

run();
