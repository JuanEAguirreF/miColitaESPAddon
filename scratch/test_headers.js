const axios = require('axios');

async function testUrl() {
  // Use the exact resolved URL from the latest log
  const url = 'https://s1.vimeos.net/hls2/03/00010/s262fikwk6wz_,n,h,.urlset/master.m3u8?t=j60qxswMylT_PcnuhrwJUKFdQs67vLkuYru5yPjOwJM&s=1780220071&e=43200&v=250131570&i=0.3&sp=0&fr=s262fikwk6wz&r=e';
  
  console.log("1. Probando petición sin cabecera Referer...");
  try {
    const res = await axios.get(url, { timeout: 5000 });
    console.log("¡Éxito sin referer! Status:", res.status, "Length:", res.data.length);
  } catch (e) {
    console.log("Fallo sin referer. Status:", e.response ? e.response.status : e.message);
  }

  console.log("\n2. Probando petición con Referer: https://vimeos.net/ ...");
  try {
    const res = await axios.get(url, {
      headers: {
        "Referer": "https://vimeos.net/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 5000
    });
    console.log("¡Éxito con referer! Status:", res.status, "Length:", res.data.length);
    console.log("Contenido:", res.data.substring(0, 300));
  } catch (e) {
    console.log("Fallo con referer. Status:", e.response ? e.response.status : e.message);
  }
}

testUrl();
