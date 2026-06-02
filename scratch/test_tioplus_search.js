const axios = require('axios');

async function run() {
  const query = "Looney";
  const url = `https://tioplus.app/api/search/${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    console.log("Search status:", res.status);
    console.log("Search response length:", res.data.length);
    console.log("=========================================");
    console.log(res.data.substring(0, 1500));
    console.log("=========================================");
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
