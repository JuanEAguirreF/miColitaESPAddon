const lamovieService = require('../api/scraper/lamovie.service');
const { resolveEmbedUrl } = require('../api/scraper/download.service');
const axios = require('axios');

async function testMovie() {
  console.log("\n==================================================");
  console.log("PROBANDO INTEGRACIÓN LOCAL - PELÍCULA (tt0309698 - Identidad)");
  console.log("==================================================");
  
  const title = "Identidad";
  const year = 2003;
  
  try {
    console.log(`Buscando streams para: "${title}" (${year})`);
    const embeds = await lamovieService.getMovieStreams(title, year);
    console.log(`Embeds encontrados: ${embeds.length}`);
    
    if (embeds.length > 0) {
      console.log("\nEmbeds encontrados:");
      embeds.forEach((emb, i) => {
        console.log(`[${i+1}] Server: ${emb.server}, Lang: ${emb.lang}, Quality: ${emb.quality}`);
        console.log(`    URL: ${emb.url}`);
      });
      
      // Intentar resolver el primer embed de tipo goodstream o streamwish
      const targetEmbed = embeds.find(e => e.server.toLowerCase().includes('goodstream') || e.server.toLowerCase().includes('online') || e.url.includes('goodstream') || e.url.includes('hlswish'));
      if (targetEmbed) {
        console.log(`\nProbando resolución del embed seleccionado: ${targetEmbed.server} (${targetEmbed.url})`);
        const directUrl = await resolveEmbedUrl(targetEmbed.url);
        console.log("\n==================================================");
        console.log("¡RESULTADO DE RESOLUCIÓN DE VIDEO DIRECTO EXITOSO!");
        console.log("==================================================");
        console.log(`Direct URL: ${directUrl}`);
        console.log("==================================================\n");
      }
    } else {
      console.log("No se encontraron embeds.");
    }
  } catch (err) {
    console.error("Error en testMovie:", err.message);
  }
}

async function testSeries() {
  console.log("\n==================================================");
  console.log("PROBANDO INTEGRACIÓN LOCAL - SERIE (tt3006802 - BoJack Horseman S01E01)");
  console.log("==================================================");
  
  const title = "BoJack Horseman";
  const season = 1;
  const episode = 1;
  
  try {
    console.log(`Buscando streams para: "${title}" S${season}E${episode}`);
    const embeds = await lamovieService.getSeriesStreams(title, season, episode);
    console.log(`Embeds encontrados: ${embeds.length}`);
    
    if (embeds.length > 0) {
      console.log("\nEmbeds encontrados:");
      embeds.forEach((emb, i) => {
        console.log(`[${i+1}] Server: ${emb.server}, Lang: ${emb.lang}, Quality: ${emb.quality}`);
        console.log(`    URL: ${emb.url}`);
      });
    } else {
      console.log("No se encontraron embeds.");
    }
  } catch (err) {
    console.error("Error en testSeries:", err.message);
  }
}

async function run() {
  await testMovie();
  await testSeries();
}

run();
