const lamovieService = require('../api/scraper/lamovie.service');
const { resolveEmbedUrl } = require('../api/scraper/download.service');
const axios = require('axios');

const tmdbApiKeys = [
  "10923b261ba94d897ac6b81148314a3f",
  "b573d051ec65413c949e68169923f7ff",
  "da40aaeca884d8c9a9a4c088917c474c"
];

async function getSpanishTitle(imdbId, type) {
  const resolvedType = type === 'movie' ? 'movie' : 'tv';
  for (const apiKey of tmdbApiKeys) {
    try {
      const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id&language=es-MX`;
      const response = await axios.get(url, { timeout: 4000 });
      const data = response.data;
      if (data) {
        const tvResults = data.tv_results || [];
        const movieResults = data.movie_results || [];
        if (tvResults.length > 0 && tvResults[0].name) {
          return tvResults[0].name;
        }
        if (movieResults.length > 0 && movieResults[0].title) {
          return movieResults[0].title;
        }
      }
    } catch (e) {
      // Fail silently to try next key
    }
  }
  return null;
}

async function testTranslationAndResolution() {
  console.log("\n==================================================");
  console.log("PROBANDO CASO CON TRADUCCIÓN: tt27331527 (Man on Fire / Hombre en llamas)");
  console.log("==================================================");
  
  const imdbId = 'tt27331527';
  const season = 1;
  const episode = 1;
  
  try {
    console.log(`Paso 1: Traduciendo ID ${imdbId} a título en español...`);
    const spanishTitle = await getSpanishTitle(imdbId, 'series');
    console.log(`Resultado de Traducción: "${spanishTitle}"`);
    
    if (spanishTitle) {
      console.log(`\nPaso 2: Buscando streams en LaMovie para: "${spanishTitle}" S${season}E${episode}...`);
      const embeds = await lamovieService.getSeriesStreams(spanishTitle, season, episode);
      console.log(`Embeds encontrados: ${embeds.length}`);
      
      if (embeds.length > 0) {
        embeds.forEach((emb, i) => {
          console.log(`[${i+1}] Server: ${emb.server}, Lang: ${emb.lang}, Quality: ${emb.quality}`);
          console.log(`    URL: ${emb.url}`);
        });
        
        // Intentar resolver un video directo del primer embed
        const target = embeds[0];
        console.log(`\nPaso 3: Intentando resolver video directo de: ${target.server} (${target.url})`);
        const directUrl = await resolveEmbedUrl(target.url);
        console.log("\n==================================================");
        console.log("¡RESULTADO DE RESOLUCIÓN CON TRADUCCIÓN COMPLETADA!");
        console.log("==================================================");
        console.log(`Direct URL: ${directUrl}`);
        console.log("==================================================\n");
      } else {
        console.log("No se encontraron embeds para la traducción.");
      }
    } else {
      console.log("No se pudo obtener la traducción de TMDB.");
    }
  } catch (err) {
    console.error("Error en testTranslationAndResolution:", err.message);
  }
}

async function run() {
  await testTranslationAndResolution();
}

run();
