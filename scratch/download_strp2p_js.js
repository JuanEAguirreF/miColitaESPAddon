const axios = require('axios');
const fs = require('fs');
const path = require('path');

const url = 'https://pelisplus.strp2p.com/assets/index-XlAf8z-l.js';
const outputFile = path.join(__dirname, 'strp2p_bundle.js');

async function run() {
  console.log(`Downloading strp2p JS bundle from: ${url}`);
  try {
    const response = await axios.get(url);
    fs.writeFileSync(outputFile, response.data);
    console.log(`Successfully saved JS bundle to: ${outputFile} (Size: ${response.data.length} bytes)`);
  } catch (err) {
    console.error("Error downloading JS bundle:", err.message);
  }
}

run();
