const axios = require('axios');
const fs = require('fs');

async function download(url, filename) {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    fs.writeFileSync(filename, res.data);
    console.log(`Downloaded ${url} -> ${filename} (${res.data.length} bytes)`);
  } catch (e) {
    console.error(`Failed to download ${url}:`, e.message);
  }
}

async function run() {
  await download("https://tioplus.app/css/app.js?1", "scratch/tioplus_app.js");
  await download("https://tioplus.app/css/l.js", "scratch/tioplus_l.js");
  await download("https://tioplus.app/css/m.js", "scratch/tioplus_m.js");
  await download("https://tioplus.app/css/x.js", "scratch/tioplus_x.js");
}

run();
