const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('https://tioplus.app/pelicula/los-looney-tunes-en-un-perfume-nunca-visto', {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    console.log("Headers:", res.headers);
    console.log("Cookies:", res.headers['set-cookie']);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
