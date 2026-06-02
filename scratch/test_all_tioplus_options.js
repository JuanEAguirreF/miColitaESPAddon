const puppeteer = require('puppeteer');

const servers = [
  { name: "Earnvids - Opción 1", code: "cDI3Q25sMng4M2RlSm00aUR2WmJGaFRNVnFxZnlBWHc5b1NlYkRBLzgveVZwN1pRNnRrPQ==" },
  { name: "TioPlus - Opción 2", code: "cDI3Q25sMng4M2ROSW40L0ZmQlJFQkhkQytlVHlrZXJyNTJLSlQ4cHFQTEErdTRSdmR3PQ==" },
  { name: "P2P - Opción 3", code: "cDI3Q25sMng4M2RZS21ZakZPSlNFd3VYVnZDTzExcXZyc2lFZVNkdXJLWEFvS2Rl" },
  { name: "UPFAST - Opción 4", code: "cDI3Q25sMng4M2RZS21ZakZPSlNFd3VYVVBTUzFFYXY4c1RFTjJBaSsrVERxdz09" },
  { name: "PLAYER - Opción 5", code: "cDI3Q25sMng4M2RZS21ZakZPSlNFd3VOU3FySXlnMnY3TXFTY1hwanV1YVo1ZnhNdmROZ2RRPT0=" }
];

async function testServer(srv) {
  const playerParam = Buffer.from(srv.code).toString('base64');
  const url = `https://tioplus.app/player/${playerParam}`;
  console.log(`\n==================================================`);
  console.log(`TESTING: ${srv.name}`);
  console.log(`URL: ${url}`);
  console.log(`==================================================`);
  
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

    let interceptedRequests = [];
    page.on('request', req => {
      const rUrl = req.url();
      if (rUrl !== url && !rUrl.includes('cloudflareinsights') && !rUrl.includes('favicon') && !rUrl.includes('fonts.googleapis') && !rUrl.includes('fonts.gstatic') && !rUrl.includes('play.png')) {
        interceptedRequests.push(rUrl);
        console.log(`  [REQUEST] -> ${rUrl.substring(0, 150)}`);
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 4000));
    console.log("  Final Page URL:", page.url());
  } catch (e) {
    console.error("  Error:", e.message);
  } finally {
    await browser.close();
  }
}

async function run() {
  for (const srv of servers) {
    await testServer(srv);
  }
}

run();
