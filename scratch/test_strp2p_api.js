const axios = require('axios');

const url = 'https://pelisplus.strp2p.com/api/v1/info?id=yji51l';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://pelisplus.strp2p.com/'
};

async function run() {
  console.log(`Fetching P2P info: ${url}`);
  try {
    const response = await axios.get(url, { headers });
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("Error fetching P2P info:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Response:", err.response.data);
    }
  }
}

run();
