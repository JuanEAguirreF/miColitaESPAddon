const axios = require('axios');
const { ApiError } = require('../utils/api-error');

const BASE_URL = 'https://lamovie.org';
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
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
 * Searches for movies or series on LaMovie.org using their WP REST API.
 * @param {string} query The search query (e.g. "Bojack Horseman")
 * @returns {Promise<Array>} List of found posts
 */
async function searchContent(query) {
  try {
    const url = `${BASE_URL}/wp-api/v1/search?filter=%7B%7D&postType=any&q=${encodeURIComponent(query)}&postsPerPage=26`;
    console.log(`[LaMovie Service] Searching: "${query}" via ${url}`);
    
    const response = await axios.get(url, {
      headers: HTTP_HEADERS,
      timeout: REQUEST_TIMEOUT
    });
    
    if (response.data && !response.data.error && response.data.data && response.data.data.posts) {
      return response.data.data.posts;
    }
  } catch (err) {
    console.error(`[LaMovie Service] Search error for "${query}":`, err.message);
  }
  return [];
}

/**
 * Resolves the player embeds for a movie or an episode post ID.
 * @param {number|string} postId The post ID
 * @returns {Promise<Array>} List of embed streams
 */
async function getPlayerEmbeds(postId) {
  try {
    const url = `${BASE_URL}/wp-api/v1/player?postId=${postId}&demo=0`;
    console.log(`[LaMovie Service] Fetching player embeds for postId: ${postId}`);
    
    const response = await axios.get(url, {
      headers: HTTP_HEADERS,
      timeout: REQUEST_TIMEOUT
    });
    
    if (response.data && !response.data.error && response.data.data && response.data.data.embeds) {
      return response.data.data.embeds;
    }
  } catch (err) {
    console.error(`[LaMovie Service] Player embeds error for postId ${postId}:`, err.message);
  }
  return [];
}

/**
 * Lists episodes for a specific series and season.
 * @param {number|string} seriesId The main series post ID
 * @param {number|string} season Season number
 * @returns {Promise<Array>} List of episodes
 */
async function listEpisodes(seriesId, season) {
  try {
    const url = `${BASE_URL}/wp-api/v1/single/episodes/list?_id=${seriesId}&season=${season}&page=1&postsPerPage=100`;
    console.log(`[LaMovie Service] Listing S${season} episodes for seriesId: ${seriesId}`);
    
    const response = await axios.get(url, {
      headers: HTTP_HEADERS,
      timeout: REQUEST_TIMEOUT
    });
    
    if (response.data && !response.data.error && response.data.data && response.data.data.posts) {
      return response.data.data.posts;
    }
  } catch (err) {
    console.error(`[LaMovie Service] List episodes error for seriesId ${seriesId} S${season}:`, err.message);
  }
  return [];
}

/**
 * Searches and finds the best matching movie on LaMovie.org, then returns its embeds.
 * @param {string} movieTitle The title of the movie
 * @param {number|string} year The release year
 * @returns {Promise<Array>} List of embeds
 */
async function getMovieStreams(movieTitle, year) {
  const posts = await searchContent(movieTitle);
  if (!posts || posts.length === 0) {
    console.log(`[LaMovie Service] No posts found for movie search: "${movieTitle}"`);
    return [];
  }

  // Filter posts of type "movies"
  const movies = posts.filter(post => post.type === 'movies' || post.postType === 'movies');
  if (movies.length === 0) {
    console.log(`[LaMovie Service] No posts classified as movies for: "${movieTitle}"`);
    return [];
  }

  const targetClean = cleanName(movieTitle);
  let bestMatch = null;

  // 1. Exact title + year match
  if (year) {
    bestMatch = movies.find(m => cleanName(m.title).includes(targetClean) && m.title.includes(String(year)));
  }

  // 2. Exact clean title match
  if (!bestMatch) {
    bestMatch = movies.find(m => cleanName(m.title) === targetClean);
  }

  // 3. Fuzzy clean title match
  if (!bestMatch) {
    bestMatch = movies.find(m => {
      const titleClean = cleanName(m.title);
      return titleClean.includes(targetClean) || targetClean.includes(titleClean);
    });
  }

  // 4. Fallback to first result
  if (!bestMatch) {
    bestMatch = movies[0];
  }

  console.log(`[LaMovie Service] Selected movie post: "${bestMatch.title}" (ID: ${bestMatch._id}, Slug: ${bestMatch.slug})`);
  return await getPlayerEmbeds(bestMatch._id);
}

/**
 * Searches and finds the best matching series, maps the episode, and returns embeds.
 * @param {string} seriesTitle The title of the series
 * @param {number} season Season number
 * @param {number} episode Episode number
 * @returns {Promise<Array>} List of embeds
 */
async function getSeriesStreams(seriesTitle, season, episode) {
  const posts = await searchContent(seriesTitle);
  if (!posts || posts.length === 0) {
    console.log(`[LaMovie Service] No posts found for series search: "${seriesTitle}"`);
    return [];
  }

  // Filter posts of type "tvshows"
  const tvshows = posts.filter(post => post.type === 'tvshows' || post.postType === 'tvshows');
  if (tvshows.length === 0) {
    console.log(`[LaMovie Service] No posts classified as tvshows for: "${seriesTitle}"`);
    return [];
  }

  const targetClean = cleanName(seriesTitle);
  let bestMatch = null;

  // 1. Exact clean title match
  bestMatch = tvshows.find(t => cleanName(t.title) === targetClean);

  // 2. Fuzzy clean title match
  if (!bestMatch) {
    bestMatch = tvshows.find(t => {
      const titleClean = cleanName(t.title);
      return titleClean.includes(targetClean) || targetClean.includes(titleClean);
    });
  }

  // 3. Fallback to first result
  if (!bestMatch) {
    bestMatch = tvshows[0];
  }

  console.log(`[LaMovie Service] Selected series post: "${bestMatch.title}" (ID: ${bestMatch._id})`);
  
  // Fetch episodes for the target season
  const episodesList = await listEpisodes(bestMatch._id, season);
  if (!episodesList || episodesList.length === 0) {
    console.log(`[LaMovie Service] No episodes found for series: "${bestMatch.title}" S${season}`);
    return [];
  }

  // Find the matching episode number. 
  // In LaMovie's episode JSON, slugs usually look like: "bojack-horseman-temporada-1-episodio-1"
  // Or the title contains: "Temporada 1 Episodio 1"
  const matchingEpisode = episodesList.find(ep => {
    const slug = ep.slug || '';
    const title = ep.title || '';
    
    // Check in slug (e.g. episodic index)
    const slugMatch = slug.match(/episodio-(\d+)/i);
    if (slugMatch && parseInt(slugMatch[1], 10) === episode) {
      return true;
    }
    
    // Check in title
    const titleMatch = title.match(/Episodio\s+(\d+)/i);
    if (titleMatch && parseInt(titleMatch[1], 10) === episode) {
      return true;
    }
    
    // Fallback: if we only have ep.episode metadata field
    if (ep.episode && parseInt(ep.episode, 10) === episode) {
      return true;
    }

    return false;
  });

  if (!matchingEpisode) {
    console.log(`[LaMovie Service] Episode E${episode} not found in S${season} list.`);
    return [];
  }

  console.log(`[LaMovie Service] Selected episode post: "${matchingEpisode.title}" (ID: ${matchingEpisode._id}, Slug: ${matchingEpisode.slug})`);
  return await getPlayerEmbeds(matchingEpisode._id);
}

module.exports = {
  searchContent,
  getPlayerEmbeds,
  listEpisodes,
  getMovieStreams,
  getSeriesStreams
};
