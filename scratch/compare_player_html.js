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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const html = await page.content();
    console.log("\n=========================================");
    console.log("HTML loaded by Puppeteer:");
    console.log("=========================================");
    
    // Find window.location.href in the HTML
    const match = html.match(/window\.location\.href\s*=\s*'([^']+)'/);
    if (match) {
      console.log("Found window.location.href:", match[0]);
    } else {
      console.log("Could not find window.location.href in Puppeteer HTML.");
    }
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await browser.close();
  }
}

run();
