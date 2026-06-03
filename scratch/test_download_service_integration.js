process.env.DEBUG_DOWNLOAD = "true";
const downloadService = require('../api/scraper/download.service');

async function testResolve(name, url, referer) {
  console.log(`\n==================================================`);
  console.log(`TESTING INTEGRATION: ${name}`);
  console.log(`URL: ${url}`);
  console.log(`==================================================`);
  try {
    const resolvedUrl = await downloadService.resolveEmbedUrl(url, { url: referer }, { url });
    console.log(`Resolved Direct Stream URL:`, resolvedUrl);
    if (resolvedUrl && resolvedUrl.includes('.m3u8')) {
      console.log(`STATUS: SUCCESS (Direct M3U8 resolved!)`);
    } else {
      console.log(`STATUS: FAILED (Returned non-m3u8: ${resolvedUrl})`);
    }
  } catch (e) {
    console.error(`STATUS: ERROR:`, e.message);
  }
}

async function run() {
  // Set debug log environment variable for download service
  process.env.DEBUG_DOWNLOAD = "true";
  
  // Test strp2p.com
  await testResolve(
    "P2P (strp2p.com)",
    "https://pelisplus.strp2p.com/#pa1usf",
    "https://tioplus.app/serie/spider-noir/season/1/episode/1"
  );
  
  // Test upns.pro
  await testResolve(
    "UPFAST (upns.pro)",
    "https://pelisplus.upns.pro/#9jxutq",
    "https://tioplus.app/serie/spider-noir/season/1/episode/1"
  );
  
  // Test 4meplayer.pro
  await testResolve(
    "PLAYER (4meplayer.pro)",
    "https://pelisplusto.4meplayer.pro/#x5yit",
    "https://tioplus.app/serie/spider-noir/season/1/episode/1"
  );
  
  // Test rpmstream.live
  await testResolve(
    "RPM (rpmstream.live)",
    "https://pelisplus.rpmstream.live/#jbfsmh",
    "https://tioplus.app/serie/spider-noir/season/1/episode/1"
  );
}

run();
