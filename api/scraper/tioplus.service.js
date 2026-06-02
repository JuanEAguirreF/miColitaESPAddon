const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://tioplus.app';
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Referer': `${BASE_URL}/`
};

// Helper to normalize strings for comparison
function cleanName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, "") // remove special chars
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Searches for movies or series on TioPlus.app using their search API.
 * @param {string} query The search query (e.g. "Looney Tunes")
 * @returns {Promise<Array>} List of found posts
 */
async function searchContent(query) {
  try {
    const url = `${BASE_URL}/api/search/${encodeURIComponent(query)}`;
    console.log(`[TioPlus Service] Searching: "${query}" via ${url}`);
    
    const response = await axios.get(url, {
      headers: HTTP_HEADERS,
      timeout: REQUEST_TIMEOUT
    });
    
    const html = response.data;
    if (!html) return [];
    
    const $ = cheerio.load(html);
    const posts = [];
    
    $('article.item').each((i, el) => {
      const title = $(el).find('h2').text().trim();
      const href = $(el).find('a.itemA').attr('href');
      const typeText = $(el).find('.typeItem').text().trim().toLowerCase();
      
      // Parse type: "película" or "pelicúla" -> movie, "serie" -> series
      let type = 'series';
      if (typeText.includes('pelic') || typeText.includes('pelíc') || typeText.includes('movie')) {
        type = 'movie';
      }
      
      if (href) {
        posts.push({
          title,
          url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          type
        });
      }
    });
    
    return posts;
  } catch (err) {
    console.error(`[TioPlus Service] Search error for "${query}":`, err.message);
  }
  return [];
}

/**
 * Resolves a player URL immediately to get the raw decrypted video host link.
 * @param {string} serverCode The data-server Base64 token from TioPlus
 * @param {string} refererPage The movie or episode page URL (Referer)
 * @returns {Promise<string|null>} The raw decrypted host URL or null
 */
async function resolvePlayerToken(serverCode, refererPage) {
  try {
    // TioPlus double base64 encodes the token for the player endpoint
    const playerParam = Buffer.from(serverCode).toString('base64');
    const playerUrl = `${BASE_URL}/player/${playerParam}`;
    
    // We request the player page immediately to ensure the session/time-lock is valid
    const response = await axios.get(playerUrl, {
      headers: {
        ...HTTP_HEADERS,
        'Referer': refererPage
      },
      timeout: REQUEST_TIMEOUT
    });
    
    const html = response.data;
    if (!html) return null;
    
    // Find window.location.href redirect link in inline script
    const match = html.match(/window\.location\.href\s*=\s*'([^']+)'/);
    if (match && match[1]) {
      const resolvedUrl = match[1];
      
      // Check if it's the dummy/corrupted redirect (starts with httxs or contains control characters)
      const isCorrupted = resolvedUrl.includes('httxs') || resolvedUrl.includes('\x15') || resolvedUrl.includes('\ufffd');
      if (!isCorrupted) {
        return resolvedUrl;
      }
    }
  } catch (err) {
    console.error(`[TioPlus Service] Error resolving player token:`, err.message);
  }
  return null;
}

/**
 * Searches and finds the best matching movie on TioPlus.app, then returns its streams.
 * @param {string} movieTitle The title of the movie
 * @param {number|string} year The release year
 * @returns {Promise<Array>} List of resolved embeds
 */
async function getMovieStreams(movieTitle, year) {
  const posts = await searchContent(movieTitle);
  if (!posts || posts.length === 0) {
    console.log(`[TioPlus Service] No posts found for movie search: "${movieTitle}"`);
    return [];
  }
  
  // Filter movies
  const movies = posts.filter(p => p.type === 'movie');
  if (movies.length === 0) {
    console.log(`[TioPlus Service] No movies found in search results for: "${movieTitle}"`);
    return [];
  }
  
  const targetClean = cleanName(movieTitle);
  let bestMatch = null;
  
  // 1. Title + Year match
  if (year) {
    bestMatch = movies.find(m => cleanName(m.title).includes(targetClean) && m.title.includes(String(year)));
  }
  
  // 2. Clean title exact match
  if (!bestMatch) {
    bestMatch = movies.find(m => cleanName(m.title) === targetClean);
  }
  
  // 3. Fuzzy clean title match
  if (!bestMatch) {
    bestMatch = movies.find(m => {
      const clean = cleanName(m.title);
      return clean.includes(targetClean) || targetClean.includes(clean);
    });
  }
  
  // 4. Fallback to first movie
  if (!bestMatch) {
    bestMatch = movies[0];
  }
  
  console.log(`[TioPlus Service] Selected movie post: "${bestMatch.title}" (${bestMatch.url})`);
  
  // Fetch movie page
  try {
    const response = await axios.get(bestMatch.url, {
      headers: HTTP_HEADERS,
      timeout: REQUEST_TIMEOUT
    });
    
    const $ = cheerio.load(response.data);
    const embeds = [];
    
    // Find all li options with data-server
    const options = [];
    $('li[data-server]').each((i, el) => {
      const serverCode = $(el).attr('data-server');
      const labelText = $(el).find('span').first().text().trim();
      options.push({ name: labelText, code: serverCode });
    });
    
    console.log(`[TioPlus Service] Found ${options.length} embeds on page. Resolving tokens...`);
    
    // Resolve tokens immediately in parallel/sequence
    for (const opt of options) {
      const resolvedUrl = await resolvePlayerToken(opt.code, bestMatch.url);
      if (resolvedUrl) {
        // Classify server name based on option label or resolved URL host
        let server = 'Online';
        if (opt.name.toLowerCase().includes('option') || opt.name.toLowerCase().includes('opción')) {
          server = opt.name.split('-')[0].trim();
        } else {
          server = opt.name;
        }
        
        embeds.push({
          server,
          url: resolvedUrl,
          lang: opt.name.toLowerCase().includes('castellano') ? 'Castellano' : 'Latino',
          quality: 'HD'
        });
      }
    }
    
    return embeds;
  } catch (err) {
    console.error(`[TioPlus Service] Error fetching movie page:`, err.message);
  }
  
  return [];
}

/**
 * Searches and finds the best matching series, resolves season/episode, and returns embeds.
 * @param {string} seriesTitle The title of the series
 * @param {number} season Season number
 * @param {number} episode Episode number
 * @returns {Promise<Array>} List of resolved embeds
 */
async function getSeriesStreams(seriesTitle, season, episode) {
  const posts = await searchContent(seriesTitle);
  if (!posts || posts.length === 0) {
    console.log(`[TioPlus Service] No posts found for series search: "${seriesTitle}"`);
    return [];
  }
  
  // Filter series
  const tvshows = posts.filter(p => p.type === 'series');
  if (tvshows.length === 0) {
    console.log(`[TioPlus Service] No series found in search results for: "${seriesTitle}"`);
    return [];
  }
  
  const targetClean = cleanName(seriesTitle);
  let bestMatch = null;
  
  // 1. Clean title exact match
  bestMatch = tvshows.find(t => cleanName(t.title) === targetClean);
  
  // 2. Fuzzy clean title match
  if (!bestMatch) {
    bestMatch = tvshows.find(t => {
      const clean = cleanName(t.title);
      return clean.includes(targetClean) || targetClean.includes(clean);
    });
  }
  
  // 3. Fallback to first series
  if (!bestMatch) {
    bestMatch = tvshows[0];
  }
  
  console.log(`[TioPlus Service] Selected series post: "${bestMatch.title}" (${bestMatch.url})`);
  
  // Construct direct episode URL: https://tioplus.app/serie/[slug]/season/[season]/episode/[episode]
  // Extract slug from bestMatch.url: e.g. "https://tioplus.app/serie/spider-noir" -> "spider-noir"
  const urlParts = bestMatch.url.split('/').filter(Boolean);
  const slug = urlParts.pop();
  
  const episodeUrl = `${BASE_URL}/serie/${slug}/season/${season}/episode/${episode}`;
  console.log(`[TioPlus Service] Formulating direct episode page: ${episodeUrl}`);
  
  try {
    const response = await axios.get(episodeUrl, {
      headers: HTTP_HEADERS,
      timeout: REQUEST_TIMEOUT
    });
    
    const $ = cheerio.load(response.data);
    const embeds = [];
    
    // Find all li options with data-server
    const options = [];
    $('li[data-server]').each((i, el) => {
      const serverCode = $(el).attr('data-server');
      const labelText = $(el).find('span').first().text().trim();
      options.push({ name: labelText, code: serverCode });
    });
    
    console.log(`[TioPlus Service] Found ${options.length} episode embeds. Resolving tokens...`);
    
    for (const opt of options) {
      const resolvedUrl = await resolvePlayerToken(opt.code, episodeUrl);
      if (resolvedUrl) {
        let server = 'Online';
        if (opt.name.toLowerCase().includes('option') || opt.name.toLowerCase().includes('opción')) {
          server = opt.name.split('-')[0].trim();
        } else {
          server = opt.name;
        }
        
        embeds.push({
          server,
          url: resolvedUrl,
          lang: opt.name.toLowerCase().includes('castellano') ? 'Castellano' : 'Latino',
          quality: 'HD'
        });
      }
    }
    
    return embeds;
  } catch (err) {
    console.error(`[TioPlus Service] Error fetching episode page for ${episodeUrl}:`, err.message);
  }
  
  return [];
}

module.exports = {
  searchContent,
  getMovieStreams,
  getSeriesStreams
};
