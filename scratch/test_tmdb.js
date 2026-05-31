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
      // TMDB Find by External ID
      const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id&language=es-MX`;
      console.log(`Querying TMDB for ${imdbId} using key ${apiKey.substring(0, 5)}...`);
      const response = await axios.get(url, { timeout: 5000 });
      
      const data = response.data;
      if (data) {
        // Depending on type, check tv_results or movie_results
        const tvResults = data.tv_results || [];
        const movieResults = data.movie_results || [];
        
        if (tvResults.length > 0) {
          console.log("Found TV Result:", tvResults[0].name, "| Original:", tvResults[0].original_name);
          return tvResults[0].name;
        }
        if (movieResults.length > 0) {
          console.log("Found Movie Result:", movieResults[0].title, "| Original:", movieResults[0].original_title);
          return movieResults[0].title;
        }
      }
    } catch (e) {
      console.log(`Failed TMDB query with key:`, e.message);
    }
  }
  return null;
}

async function run() {
  const imdbId = 'tt27331527'; // Man on Fire
  const title = await getSpanishTitle(imdbId, 'series');
  console.log("Resulting Spanish Title:", title);
}

run();
