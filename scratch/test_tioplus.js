const tioplusService = require('../api/scraper/tioplus.service');

async function testMovie() {
  console.log("\n==================================================");
  console.log("TESTING MOVIE: Los Looney Tunes en... Un perfume nunca visto (2015)");
  console.log("==================================================");
  try {
    const embeds = await tioplusService.getMovieStreams("Los Looney Tunes en... Un perfume nunca visto", 2015);
    console.log(`\nMovie Embeds Found: ${embeds.length}`);
    embeds.forEach((emb, i) => {
      console.log(`[${i+1}] Server: ${emb.server}, Lang: ${emb.lang}, Quality: ${emb.quality}`);
      console.log(`    URL: ${emb.url}`);
    });
  } catch (e) {
    console.error("Error in movie test:", e.message);
  }
}

async function testSeries() {
  console.log("\n==================================================");
  console.log("TESTING TV SHOW: Spider-Noir S01E01");
  console.log("==================================================");
  try {
    const embeds = await tioplusService.getSeriesStreams("Spider-Noir", 1, 1);
    console.log(`\nSeries Embeds Found: ${embeds.length}`);
    embeds.forEach((emb, i) => {
      console.log(`[${i+1}] Server: ${emb.server}, Lang: ${emb.lang}, Quality: ${emb.quality}`);
      console.log(`    URL: ${emb.url}`);
    });
  } catch (e) {
    console.error("Error in series test:", e.message);
  }
}

async function run() {
  await testMovie();
  await testSeries();
}

run();
