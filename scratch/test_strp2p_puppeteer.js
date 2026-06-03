const { resolveEmbedUrl } = require('../api/scraper/download.service');

const url = 'https://pelisplus.strp2p.com/#yji51l';
const referer = 'https://tioplus.app/';

async function run() {
  console.log("==================================================");
  console.log(`TESTING RESOLUTION FOR P2P URL: ${url}`);
  console.log("==================================================");
  
  try {
    const directUrl = await resolveEmbedUrl(url);
    console.log("\n==================================================");
    console.log("¡RESULTADO!");
    console.log("==================================================");
    console.log("Direct URL:", directUrl);
    console.log("==================================================");
  } catch (err) {
    console.error("Error during execution:", err.message);
  }
}

run();
