const app = require('../api/index');
const http = require('http');

let server;
const PORT = 7999;

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`[Test Server] Temporary test server started on port ${PORT}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log(`[Test Server] Temporary test server stopped.`);
        resolve();
      });
    } else {
      resolve();
    }
  });
}

const axios = require('axios');

async function testMovie() {
  console.log("\n==================================================");
  console.log("TESTING STREAM ENDPOINT FOR MOVIE (IMDb: tt3569230)");
  console.log("Los Looney Tunes en... Un perfume nunca visto (2015)");
  console.log("==================================================");
  try {
    const url = `http://localhost:${PORT}/stream/movie/tt3569230.json`;
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url);
    const data = response.data;
    
    if (data && data.streams) {
      console.log(`\nMerged Streams Found: ${data.streams.length}`);
      data.streams.forEach((stream, i) => {
        console.log(`[${i+1}] Name: ${stream.name.replace(/\n/g, ' ')}`);
        console.log(`    Title: ${stream.title.split('\n')[0]}`); // Show only the first line of title
        if (stream.url) console.log(`    Direct URL: ${stream.url.substring(0, 150)}...`);
        if (stream.externalUrl) console.log(`    External URL: ${stream.externalUrl}`);
      });
    } else {
      console.log("No streams returned.");
    }
  } catch (err) {
    console.error("Error testing movie:", err.message);
  }
}

async function testSeries() {
  console.log("\n==================================================");
  console.log("TESTING STREAM ENDPOINT FOR TV SHOW (IMDb: tt0903747:1:1)");
  console.log("Breaking Bad S01E01");
  console.log("==================================================");
  try {
    const url = `http://localhost:${PORT}/stream/series/tt0903747:1:1.json`;
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url);
    const data = response.data;
    
    if (data && data.streams) {
      console.log(`\nMerged Streams Found: ${data.streams.length}`);
      data.streams.forEach((stream, i) => {
        console.log(`[${i+1}] Name: ${stream.name.replace(/\n/g, ' ')}`);
        console.log(`    Title: ${stream.title.split('\n')[0]}`);
        if (stream.url) console.log(`    Direct URL: ${stream.url.substring(0, 150)}...`);
        if (stream.externalUrl) console.log(`    External URL: ${stream.externalUrl}`);
      });
    } else {
      console.log("No streams returned.");
    }
  } catch (err) {
    console.error("Error testing series:", err.message);
  }
}

async function run() {
  await startServer();
  try {
    await testMovie();
    await testSeries();
  } catch (e) {
    console.error("Execution error:", e.message);
  } finally {
    await stopServer();
  }
}

run();
