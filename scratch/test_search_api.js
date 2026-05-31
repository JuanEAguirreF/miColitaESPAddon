const puppeteer = require('puppeteer');

async function run() {
  console.log("Iniciando Puppeteer para buscar la API de búsqueda...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  page.on('request', req => {
    const url = req.url();
    if (url.includes('wp-json') || url.includes('wp-api') || url.includes('search') || url.includes('query')) {
      console.log(`[SEARCH REQ] ${req.method()} - ${url}`);
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('wp-json') || url.includes('wp-api')) {
      try {
        const text = await res.text();
        console.log(`[SEARCH RESP] ${url.substring(0, 120)} - Status: ${res.status()}`);
        console.log(`[SEARCH RESP BODY] ${text.substring(0, 500)}...`);
      } catch (e) {}
    }
  });

  try {
    console.log("Cargando página de búsqueda...");
    await page.goto('https://lamovie.org/?s=bojack', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("Cargado. Esperando 5 segundos...");
    await new Promise(r => setTimeout(r, 5000));
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await browser.close();
    console.log("Finalizado.");
  }
}

run();
