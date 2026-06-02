const puppeteer = require('puppeteer');

async function run() {
  const url = 'https://tioplus.app/player/Y0RJM1EyeHNNbmc0TTNSbFNtMDBhVVJ2Wm1KaFJGTVZkeEZ6ZWxCWGVENTFiR1JCTHpndmVWWndOMWhSTjZ0clBRPT0=';
  
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({
      "Referer": "https://tioplus.app/pelicula/los-looney-tunes-en-un-perfume-nunca-visto"
    });

    console.log("Navigating to player page...");
    
    // Intercept requests to see where it tries to navigate
    page.on('request', req => {
      const rUrl = req.url();
      if (rUrl !== url && !rUrl.includes('cloudflareinsights') && !rUrl.includes('favicon')) {
        console.log(`[REQUEST] -> ${rUrl}`);
      }
    });

    page.on('console', msg => {
      console.log(`[CONSOLE] -> ${msg.text()}`);
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    console.log("Page loaded. Current URL:", page.url());
    
    // Let's wait a bit for any setTimeout redirect
    console.log("Waiting for redirection...");
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Final URL:", page.url());
  } catch (e) {
    console.error("Error during Puppeteer execution:", e.message);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

run();
