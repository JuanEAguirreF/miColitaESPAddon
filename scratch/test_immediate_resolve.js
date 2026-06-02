const axios = require('axios');
const cheerio = require('cheerio');

const HTTP_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
};

async function run() {
  const movieUrl = 'https://tioplus.app/pelicula/los-looney-tunes-en-un-perfume-nunca-visto';
  console.log(`1. Fetching fresh movie page: ${movieUrl}...`);
  
  try {
    const pageRes = await axios.get(movieUrl, { headers: HTTP_HEADERS, timeout: 10000 });
    const $ = cheerio.load(pageRes.data);
    
    // Find all data-server attributes
    const options = [];
    $('li[data-server]').each((i, el) => {
      const serverCode = $(el).attr('data-server');
      const serverName = $(el).find('span').first().text();
      options.push({ name: serverName, code: serverCode });
    });
    
    console.log(`Found ${options.length} server options.`);
    if (options.length === 0) {
      console.log("No options found. Exiting.");
      return;
    }
    
    // Let's test the first option immediately!
    const target = options[0];
    const playerParam = Buffer.from(target.code).toString('base64');
    const playerUrl = `https://tioplus.app/player/${playerParam}`;
    
    console.log(`\n2. Immediately requesting player page: ${playerUrl} (${target.name})`);
    
    const playerRes = await axios.get(playerUrl, {
      headers: {
        ...HTTP_HEADERS,
        "Referer": movieUrl
      },
      timeout: 10000
    });
    
    const html = playerRes.data;
    console.log("Received Player HTML length:", html.length);
    
    // Find window.location.href in the HTML
    const match = html.match(/window\.location\.href\s*=\s*'([^']+)'/);
    if (match) {
      console.log("Found window.location.href:", match[1]);
      
      // Let's print the character codes to see if it's still corrupted or valid!
      const isCorrupted = match[1].includes('httxs') || match[1].includes('\x15');
      console.log("Is the URL corrupted/obfuscated?", isCorrupted ? "YES (httxs)" : "NO (VALID!)");
    } else {
      console.log("Could not find window.location.href in player HTML.");
    }
  } catch (e) {
    console.error("Error during immediate resolution:", e.message);
  }
}

run();
