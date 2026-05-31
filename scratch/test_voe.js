const { resolveEmbedUrl } = require('../api/scraper/download.service');

async function run() {
  const voeUrl = 'https://voe.sx/e/c8wkr17jgi9y'; // Identidad (2003) Latino VOE embed
  
  console.log(`Resolviendo URL de VOE: ${voeUrl}...`);
  try {
    const directUrl = await resolveEmbedUrl(voeUrl);
    console.log("\n==================================================");
    console.log("¡RESULTADO DE RESOLUCIÓN DE VOE COMPLETADO!");
    console.log("==================================================");
    console.log(`Direct URL: ${directUrl}`);
    console.log("==================================================");
  } catch (e) {
    console.error("Error al resolver VOE:", e.message);
  }
}

run();
