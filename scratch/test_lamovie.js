const puppeteer = require('puppeteer');

async function run() {
  console.log("Iniciando Puppeteer...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  const page = await browser.newPage();
  
  // Establecer User-Agent realista
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  // Habilitar interceptación de respuestas de red para inspeccionar peticiones API
  await page.setRequestInterception(false);
  
  console.log("\n==================================================");
  console.log("PROBANDO PELÍCULA: Identidad (2003)");
  console.log("==================================================");
  
  page.on('request', request => {
    const url = request.url();
    // Registrar llamadas a APIs interesantes o reproductores/iframes
    if (url.includes('wp-json') || url.includes('wp-api') || url.includes('/play') || url.includes('player') || url.includes('embed') || url.includes('iframe') || url.includes('ajax') || url.includes('video')) {
      console.log(`[REQ] ${request.method()} - ${url.substring(0, 150)}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('wp-json') || url.includes('wp-api') || url.includes('ajax')) {
      try {
        const text = await response.text();
        console.log(`[RESP] ${url.substring(0, 120)} - Status: ${response.status()}`);
        console.log(`[RESP BODY] ${text.substring(0, 500)}...`);
      } catch (e) {
        // Ignorar si no se puede leer el cuerpo
      }
    }
  });

  try {
    await page.goto('https://lamovie.org/peliculas/identidad-2003/', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("Página cargada. Esperando 5 segundos para procesamiento SPA...");
    await new Promise(r => setTimeout(r, 5000));
    
    // Inspeccionar iframes en la página
    const iframes = await page.evaluate(() => {
      const iframeElements = Array.from(document.querySelectorAll('iframe'));
      return iframeElements.map(iframe => ({
        src: iframe.src,
        id: iframe.id,
        class: iframe.className
      }));
    });
    console.log("\nIframes encontrados:", iframes);

    // Inspeccionar el DOM para botones de reproductor o servidores
    const htmlSnippet = await page.evaluate(() => {
      // Intentar obtener el contenedor de reproducción o botones
      const playerContainer = document.querySelector('.movies-full__player, #player, .player, .video-container');
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.outerHTML);
      return {
        playerContainer: playerContainer ? playerContainer.outerHTML : "No encontrado",
        buttons: buttons.slice(0, 15)
      };
    });
    console.log("\nContenedor de Reproductor:");
    console.log(htmlSnippet.playerContainer);
    
  } catch (e) {
    console.error("Error en película:", e);
  }

  console.log("\n==================================================");
  console.log("PROBANDO SERIES: Bojack Horseman (2014)");
  console.log("==================================================");
  
  try {
    await page.goto('https://lamovie.org/series/bojack-horseman-2014/', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("Página cargada. Esperando 5 segundos...");
    await new Promise(r => setTimeout(r, 5000));

    // Buscar el botón de ver episodios e intentar hacerle clic
    console.log("Intentando buscar el botón de episodios...");
    const clicked = await page.evaluate(async () => {
      const btn = document.querySelector('button[aria-label="Ver episodios"], .playerse__toggle-btn');
      if (btn) {
        btn.click();
        return "Botón encontrado y clicado";
      }
      return "Botón NO encontrado";
    });
    console.log("Resultado del clic:", clicked);
    
    await new Promise(r => setTimeout(r, 3000));

    // Inspeccionar la lista de episodios cargados
    const infoSeries = await page.evaluate(() => {
      const episodes = Array.from(document.querySelectorAll('.playerse__episode, a[href*="episodio"], .episode, li[data-id]')).map(el => ({
        text: el.innerText ? el.innerText.trim() : "",
        html: el.outerHTML
      }));
      const seasonSelect = document.querySelector('select, .season-select');
      return {
        episodesCount: episodes.length,
        episodesSample: episodes.slice(0, 5),
        seasonSelect: seasonSelect ? seasonSelect.outerHTML : "No encontrado"
      };
    });
    console.log("Info Series:", infoSeries);
    
  } catch (e) {
    console.error("Error en series:", e);
  }

  await browser.close();
  console.log("\nTerminado.");
}

run();
