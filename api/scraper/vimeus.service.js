const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://vimeus.net';
const DEFAULT_VIEW_KEY = process.env.VIMEUS_VIEW_KEY || '1yb-YttxSw44eJDtfo4dj4zFrY8AkREChMdcEtURohE';
const REQUEST_TIMEOUT = 10000;

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Referer': `${BASE_URL}/`
};

/**
 * Unpacks Dean Edwards packed Javascript code:
 * eval(function(p,a,c,k,e,d){...}(...))
 */
function unpackDeanEdwards(packedCode) {
  if (!packedCode || typeof packedCode !== 'string') return null;
  const match = packedCode.match(/eval\(function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*([rd])/);
  if (!match) return null;
  try {
    const cleaned = packedCode.trim().replace(/^eval\s*/, '');
    return (new Function('return ' + cleaned))();
  } catch (err) {
    return null;
  }
}

/**
 * Resolves an embed page (e.g. vimeos.net or vimeus.net/e/...) to its direct M3U8 stream URL
 * by unpacking Dean Edwards code or extracting file/sources.
 */
async function extractM3u8FromEmbed(embedUrl) {
  if (!embedUrl) return null;
  try {
    const res = await axios.get(embedUrl, {
      headers: {
        'User-Agent': HTTP_HEADERS['User-Agent'],
        'Referer': `${BASE_URL}/`
      },
      timeout: REQUEST_TIMEOUT
    });

    const html = res.data;
    if (typeof html !== 'string') return null;

    // If it's a Vimeus page containing #data JSON with nested embeds
    const $ = cheerio.load(html);
    const dataJson = $('#data').text();
    if (dataJson) {
      try {
        const parsed = JSON.parse(dataJson.trim());
        if (parsed.embeds && parsed.embeds.length > 0 && parsed.embeds[0].url) {
          // Recursively extract from the actual player embed
          return await extractM3u8FromEmbed(parsed.embeds[0].url);
        }
      } catch (_) {}
    }

    // 1. Check for Dean Edwards packed script
    let m3u8Url = null;

    $('script').each((_, el) => {
      const scriptText = $(el).html() || '';
      if (scriptText.includes('eval(function(p,a,c,k,e,')) {
        const unpacked = unpackDeanEdwards(scriptText);
        if (unpacked) {
          const match = unpacked.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
          if (match) {
            m3u8Url = match[0];
            return false; // break
          }
        }
      }
    });

    if (m3u8Url) return m3u8Url;

    // 2. Direct regex search in raw HTML
    const directMatch = html.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
    if (directMatch && !directMatch[1].startsWith('blob:')) {
      return directMatch[1];
    }

    // 3. Search for sources or file json attributes
    const fileMatch = html.match(/"file"\s*:\s*"([^"]+\.m3u8[^"]*)"/i) ||
                      html.match(/file\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i);
    if (fileMatch && fileMatch[1]) {
      return fileMatch[1];
    }

    return null;
  } catch (err) {
    console.error(`[Vimeus Service] Error extracting M3U8 from embed (${embedUrl}):`, err.message);
    return null;
  }
}

/**
 * Queries Vimeus embed endpoint and extracts available embeds and metadata.
 */
async function fetchVimeusData(endpoint, queryParams) {
  const qs = new URLSearchParams(queryParams).toString();
  const url = `${BASE_URL}/e/${endpoint}?${qs}`;
  console.log(`[Vimeus Service] Requesting: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: HTTP_HEADERS,
      timeout: REQUEST_TIMEOUT
    });

    if (response.status === 200 && response.data) {
      const $ = cheerio.load(response.data);
      const dataJson = $('#data').text();
      if (dataJson) {
        return JSON.parse(dataJson.trim());
      }
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`[Vimeus Service] No content found (404) at ${url}`);
    } else {
      console.error(`[Vimeus Service] Error fetching ${url}:`, err.message);
    }
  }
  return null;
}

/**
 * Retrieves movie embeds from Vimeus.
 * Tries IMDb ID first, then TMDb ID if available.
 */
async function getMovieStreams(imdbId, tmdbId) {
  const viewKey = DEFAULT_VIEW_KEY;
  let data = null;

  // 1. Try IMDb ID
  if (imdbId) {
    data = await fetchVimeusData('movie', { imdb: imdbId, view_key: viewKey });
  }

  // 2. Fallback to TMDb ID
  if ((!data || !data.embeds || data.embeds.length === 0) && tmdbId) {
    console.log(`[Vimeus Service] Fallback to TMDB ID: ${tmdbId} for movie`);
    data = await fetchVimeusData('movie', { tmdb: tmdbId, view_key: viewKey });
  }

  if (!data || !data.embeds || data.embeds.length === 0) {
    return [];
  }

  const vimeusEmbedUrl = imdbId 
    ? `${BASE_URL}/e/movie?imdb=${imdbId}&view_key=${viewKey}`
    : `${BASE_URL}/e/movie?tmdb=${tmdbId}&view_key=${viewKey}`;

  return data.embeds.map((emb, index) => ({
    url: emb.url,
    vimeusEmbedUrl,
    server: emb.server || 'VIMEUS',
    lang: emb.lang || 'Latino',
    quality: emb.quality || 'Full HD',
    source: 'VIMEUS',
    title: data.title || '',
    index
  }));
}

/**
 * Retrieves series episode embeds from Vimeus.
 * Supports /e/serie with fallback to /e/anime if applicable.
 */
async function getSeriesStreams(imdbId, season, episode, tmdbId) {
  const viewKey = DEFAULT_VIEW_KEY;
  let data = null;

  // 1. Try /e/serie with IMDb ID
  if (imdbId) {
    data = await fetchVimeusData('serie', { imdb: imdbId, se: season, ep: episode, view_key: viewKey });
  }

  // 2. Try /e/serie with TMDb ID
  if ((!data || !data.embeds || data.embeds.length === 0) && tmdbId) {
    console.log(`[Vimeus Service] Fallback to TMDB ID: ${tmdbId} for serie S${season}E${episode}`);
    data = await fetchVimeusData('serie', { tmdb: tmdbId, se: season, ep: episode, view_key: viewKey });
  }

  // 3. Fallback to /e/anime with IMDb ID
  if (!data || !data.embeds || data.embeds.length === 0) {
    if (imdbId) {
      data = await fetchVimeusData('anime', { imdb: imdbId, se: season, ep: episode, view_key: viewKey });
    }
  }

  // 4. Fallback to /e/anime with TMDb ID
  if ((!data || !data.embeds || data.embeds.length === 0) && tmdbId) {
    data = await fetchVimeusData('anime', { tmdb: tmdbId, se: season, ep: episode, view_key: viewKey });
  }

  if (!data || !data.embeds || data.embeds.length === 0) {
    return [];
  }

  const vimeusEmbedUrl = imdbId
    ? `${BASE_URL}/e/serie?imdb=${imdbId}&se=${season}&ep=${episode}&view_key=${viewKey}`
    : `${BASE_URL}/e/serie?tmdb=${tmdbId}&se=${season}&ep=${episode}&view_key=${viewKey}`;

  return data.embeds.map((emb, index) => ({
    url: emb.url,
    vimeusEmbedUrl,
    server: emb.server || 'VIMEUS',
    lang: emb.lang || 'Latino',
    quality: emb.quality || 'Full HD',
    source: 'VIMEUS',
    title: data.title || '',
    index
  }));
}

module.exports = {
  getMovieStreams,
  getSeriesStreams,
  extractM3u8FromEmbed,
  unpackDeanEdwards,
  DEFAULT_VIEW_KEY,
  BASE_URL
};
