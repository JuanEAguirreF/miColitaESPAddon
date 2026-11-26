const express = require('express');
const cors = require('express'); // Wait, the original imported cors but let's make sure it's the cors library: const cors = require('cors');
const axios = require('axios');

// Using the actual cors package
const corsMiddleware = require('cors');

// Scraper services
const { resolveEmbedUrl } = require('./scraper/download.service');
const vimeusService = require('./scraper/vimeus.service');

// Proveedores anteriores (comentados para usar Vimeus como único proveedor fiable)
// const lamovieService = require('./scraper/lamovie.service');
// const tioplusService = require('./scraper/tioplus.service');

const app = express();
app.use(corsMiddleware());

// Addon Manifest Definition for miColita Esp
const MANIFEST = {
  id: 'org.micolita.esp.addon',
  version: '1.4.0',
  name: 'miColita Esp',
  description: 'Addon de Stremio premium para ver Películas y Series en Español alimentado por Vimeus. Reproducción nativa en Stremio y Web Embeds oficiales.',
  logo: 'https://i.imgur.com/G55nEqA.png',
  background: 'https://i.imgur.com/3cPhFmg.jpeg',
  resources: ['stream'],
  types: ['movie', 'series'],
  idPrefixes: ['tt'],
  catalogs: []
};

// Memory Cache Systems
const metaCache = new Map();
const streamCache = new Map();
const directLinkCache = new Map();

const CACHE_TTL_META = 24 * 60 * 60 * 1000; // 24 hours for metadata
const CACHE_TTL_STREAMS = 3 * 60 * 60 * 1000; // 3 hours for stream lists
const CACHE_TTL_DIRECT = 3 * 60 * 60 * 1000; // 3 hours for resolved direct video URLs

// Helper to clean and normalize names for fuzzy matching
function cleanName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, "") // remove special chars
    .replace(/\s+/g, " ")
    .trim();
}

// Metadata resolver from Cinemeta
async function getContentMeta(id, type) {
  const cacheKey = `${id}:${type}`;
  const cached = metaCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL_META)) {
    console.log(`[miColita ESP] [Cache] Metadata for ${id} loaded from cache.`);
    return cached.data;
  }

  try {
    if (id.startsWith('tt')) {
      const resolvedType = type === 'movie' ? 'movie' : 'series';
      const url = `https://v3-cinemeta.strem.io/meta/${resolvedType}/${id}.json`;
      console.log(`[miColita ESP] [Meta] Fetching Cinemeta metadata from: ${url}`);
      const response = await axios.get(url, { timeout: 10000 });
      if (response.data && response.data.meta) {
        metaCache.set(cacheKey, { data: response.data.meta, timestamp: now });
        return response.data.meta;
      }
    }
  } catch (e) {
    console.error(`[miColita ESP] [Meta] Error resolving metadata for ${id}:`, e.message);
  }
  return null;
}

// Resolve embed URL to direct video source URL
async function resolveToDirectLink(id, embedUrl) {
  const cached = directLinkCache.get(id);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL_DIRECT)) {
    console.log(`[miColita ESP] [Cache] Direct video link loaded from cache.`);
    return cached.url;
  }

  console.log(`[miColita ESP] [Direct] Resolving embed: ${embedUrl} in real-time...`);
  try {
    const directUrl = await resolveEmbedUrl(embedUrl);
    if (directUrl && directUrl !== embedUrl) {
      console.log(`[miColita ESP] [Direct] Successfully resolved direct URL: ${directUrl.substring(0, 120)}...`);
      directLinkCache.set(id, { url: directUrl, timestamp: now });
      return directUrl;
    } else {
      console.log(`[miColita ESP] [Direct] Failed to resolve to a direct link (returned fallback).`);
    }
  } catch (err) {
    console.error(`[miColita ESP] [Direct] Error resolving embed to direct link:`, err.message);
  }
  return null;
}

// Fetch streams from Vimeus (single reliable provider)
// Note: previous scrapers (LaMovie and TioPlus) are commented out below as fallback reference
async function getContentStreams(title, year, type, season, episode, host, protocol, imdbId, tmdbId) {
  const cacheKey = type === 'movie' 
    ? `vimeus:${imdbId || cleanName(title)}`
    : `vimeus:${imdbId || cleanName(title)}:S${season}E${episode}`;

  const cached = streamCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL_STREAMS)) {
    console.log(`[miColita ESP] [Cache] Streams loaded from cache for key: ${cacheKey}`);
    return cached.data;
  }

  const streams = [];
  try {
    console.log(`[miColita ESP] [Vimeus] Resolving streams for: "${title}" (IMDb: ${imdbId || 'N/A'}, TMDb: ${tmdbId || 'N/A'}), Type: ${type}`);

    // Proveedor principal y único activo: Vimeus
    let vimeusEmbeds = [];
    if (type === 'movie') {
      vimeusEmbeds = await vimeusService.getMovieStreams(imdbId, tmdbId);
    } else {
      vimeusEmbeds = await vimeusService.getSeriesStreams(imdbId, season, episode, tmdbId);
    }

    /*
    // =========================================================================
    // PROVEEDORES ANTERIORES (Comentados como respaldo)
    // =========================================================================
    const [lamovieEmbeds, tioplusEmbeds] = await Promise.all([
      (async () => {
        try {
          if (type === 'movie') {
            return await lamovieService.getMovieStreams(title, year);
          } else {
            return await lamovieService.getSeriesStreams(title, season, episode);
          }
        } catch (e) {
          console.error(`[miColita ESP] [LaMovie Scraper] Error getting streams:`, e.message);
          return [];
        }
      })(),
      (async () => {
        try {
          if (type === 'movie') {
            return await tioplusService.getMovieStreams(title, year);
          } else {
            return await tioplusService.getSeriesStreams(title, season, episode);
          }
        } catch (e) {
          console.error(`[miColita ESP] [TioPlus Scraper] Error getting streams:`, e.message);
          return [];
        }
      })()
    ]);

    const mergedEmbeds = [];

    // Tag and push LaMovie streams
    if (lamovieEmbeds && lamovieEmbeds.length > 0) {
      console.log(`[miColita ESP] [Scraper] Found ${lamovieEmbeds.length} embeds on LaMovie.org`);
      lamovieEmbeds.forEach(emb => {
        mergedEmbeds.push({ ...emb, source: 'LAMOVIE' });
      });
    }

    // Tag and push TioPlus streams
    if (tioplusEmbeds && tioplusEmbeds.length > 0) {
      console.log(`[miColita ESP] [Scraper] Found ${tioplusEmbeds.length} embeds on TioPlus.app`);
      tioplusEmbeds.forEach(emb => {
        mergedEmbeds.push({ ...emb, source: 'TIOPLUS' });
      });
    }

    if (mergedEmbeds.length > 0) {
      mergedEmbeds.sort((a, b) => {
        const getScore = (embed) => {
          const u = embed.url.toLowerCase();
          const s = (embed.server || '').toLowerCase();
          if (u.includes('voe')) return 100;
          if (u.includes('vidhide') || u.includes('callistanise') || u.includes('earnvids') || s.includes('earnvids')) return 80;
          if (u.includes('filemoon')) return 70;
          if (u.includes('mixdrop')) return 65;
          if (u.includes('hlswish') || u.includes('streamwish')) return 60;
          if (u.includes('goodstream')) return 50;
          if (u.includes('vimeos')) return 40;
          if (u.includes('turbovid') || s.includes('tioplus')) return 30;
          if (s.includes('p2p')) return 20;
          if (s.includes('upfast') || u.includes('upns.pro')) return 18;
          if (s.includes('player') || u.includes('4meplayer.pro')) return 15;
          if (s.includes('rpm') || u.includes('rpmstream')) return 12;
          return 1;
        };
        return getScore(b) - getScore(a);
      });
    }
    // =========================================================================
    */

    if (vimeusEmbeds && vimeusEmbeds.length > 0) {
      console.log(`[miColita ESP] [Vimeus] Found ${vimeusEmbeds.length} embeds on Vimeus.net`);

      vimeusEmbeds.forEach((embed) => {
        const langName = (embed.lang || 'Latino').toUpperCase();
        const qualityName = (embed.quality || 'Full HD').toUpperCase();
        const serverName = (embed.server || 'VIMEUS').toUpperCase();

        const playDirectUrl = `${protocol}://${host}/play/direct?url=${encodeURIComponent(embed.url)}&id=${imdbId || cleanName(title)}_${type === 'movie' ? 'movie' : 'S' + season + 'E' + episode}_VIMEUS`;

        // 1. [NATIVO] Direct play redirect stream (plays inside Stremio)
        streams.push({
          name: `miColita\nEsp`,
          type: 'url',
          title: `⭐ [NATIVO] [${langName}] Vimeus (${qualityName})\n🎬 Reproducción nativa en reproductor interno\n⚡ Streaming ultra rápido sin publicidad`,
          url: playDirectUrl
        });

        // 2. [EMBED] Browser redirect embed (opens in external browser as backup)
        const embedUrl = embed.vimeusEmbedUrl || embed.url;
        if (embedUrl) {
          streams.push({
            name: `miColita\nEsp`,
            type: 'embed',
            title: `🔗 [EMBED] [${langName}] Vimeus Web Player (${qualityName})\n🌐 Abre en el navegador (Web Embed oficial)`,
            externalUrl: embedUrl
          });
        }
      });
    }
  } catch (err) {
    console.error(`[miColita ESP] [Vimeus] Error getting streams:`, err.message);
  }

  if (streams.length > 0) {
    streamCache.set(cacheKey, { data: streams, timestamp: now });
  }

  return streams;
}

// Landing page generator with Premium aesthetics
function getLandingPageHtml(host, protocol) {
  const manifestUrl = `${protocol}://${host}/manifest.json`;
  const stremioUrl = manifestUrl.replace(/^http/, 'stremio');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>miColita Esp | Stremio Addon</title>
    <meta name="description" content="Addon premium de Stremio para ver películas y series en español alimentado por Vimeus.net de forma nativa, veloz y sin publicidad.">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
    <!-- FontAwesome icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --bg-color: #030208;
            --card-bg: rgba(10, 6, 20, 0.5);
            --border-color: rgba(220, 38, 38, 0.15);
            --text-primary: #ffffff;
            --text-secondary: #ebdcf5;
            --accent-primary: #dc2626;
            --accent-secondary: #991b1b;
            --glow-color: rgba(220, 38, 38, 0.4);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow-x: hidden;
            background-image: 
                radial-gradient(circle at 15% 20%, rgba(220, 38, 38, 0.12) 0%, transparent 40%),
                radial-gradient(circle at 85% 85%, rgba(153, 27, 27, 0.12) 0%, transparent 40%),
                linear-gradient(rgba(220, 38, 38, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(220, 38, 38, 0.03) 1px, transparent 1px);
            background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
        }

        .container {
            max-width: 900px;
            width: 100%;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid var(--border-color);
            border-radius: 28px;
            padding: 60px 40px;
            width: 100%;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05);
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
        }

        .logo-container {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            border-radius: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 30px;
            box-shadow: 0 12px 30px var(--glow-color);
            animation: float 4s ease-in-out infinite;
        }

        .logo-container i {
            font-size: 46px;
            color: #ffffff;
        }

        h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 52px;
            font-weight: 800;
            letter-spacing: -1px;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #ffffff 40%, #dc2626 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            font-size: 18px;
            color: var(--text-secondary);
            max-width: 650px;
            margin-bottom: 40px;
            line-height: 1.6;
        }

        .actions {
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
            max-width: 500px;
            margin-bottom: 45px;
        }

        .btn {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            padding: 18px 30px;
            border-radius: 16px;
            font-size: 17px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            text-decoration: none;
            width: 100%;
            border: none;
            outline: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            color: #ffffff;
            box-shadow: 0 10px 25px var(--glow-color);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(220, 38, 38, 0.6);
        }

        .input-group {
            position: relative;
            width: 100%;
            max-width: 500px;
            margin-bottom: 35px;
        }

        .input-group input {
            width: 100%;
            padding: 18px 120px 18px 22px;
            border-radius: 16px;
            background: rgba(5, 2, 12, 0.6);
            border: 1px solid rgba(220, 38, 38, 0.2);
            color: #ffffff;
            font-size: 14px;
            outline: none;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            transition: border-color 0.3s;
        }

        .input-group input:focus {
            border-color: var(--accent-primary);
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.15);
        }

        .input-group button.copy-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(153, 27, 27, 0.2));
            border: 1px solid rgba(220, 38, 38, 0.3);
            border-radius: 12px;
            padding: 10px 16px;
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .input-group button.copy-btn:hover {
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            border-color: transparent;
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 25px;
            width: 100%;
            margin-top: 25px;
        }

        .feature-card {
            background: rgba(220, 38, 38, 0.03);
            border: 1px solid rgba(220, 38, 38, 0.06);
            border-radius: 20px;
            padding: 25px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            transition: all 0.3s ease;
        }

        .feature-card:hover {
            background: rgba(220, 38, 38, 0.06);
            border-color: rgba(220, 38, 38, 0.25);
            transform: translateY(-3px);
        }

        .feature-card i {
            font-size: 28px;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .feature-card h3 {
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
        }

        .feature-card p {
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.4;
        }

        footer {
            margin-top: 50px;
            font-size: 12px;
            color: rgba(235, 220, 245, 0.4);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        footer a {
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 0.2s;
        }

        footer a:hover {
            color: var(--accent-primary);
        }

        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }

        @media (max-width: 600px) {
            h1 { font-size: 38px; }
            .card { padding: 40px 20px; }
            .features { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div style="display: flex; justify-content: center; width: 100%;">
                <div class="logo-container">
                    <i class="fa-solid fa-play"></i>
                </div>
            </div>
            
            <h1>miColita Esp</h1>
            <p class="subtitle">Disfruta de las mejores películas y series en Stremio con audio Español (Latino o Castellano) de forma nativa, ultra rápida y libre de publicidad.</p>
            
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                <div class="actions">
                    <a href="${stremioUrl}" class="btn btn-primary">
                        <i class="fa-solid fa-circle-plus"></i> Instalar en Stremio
                    </a>
                </div>

                <div style="font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px;">
                    O copia el enlace del manifest para instalarlo manualmente:
                </div>

                <div class="input-group">
                    <input type="text" id="manifest-url" value="${manifestUrl}" readonly>
                    <button class="copy-btn" onclick="copyManifestUrl()"><i class="fa-regular fa-copy"></i> Copiar</button>
                </div>
            </div>

            <div class="features">
                <div class="feature-card">
                    <i class="fa-solid fa-bolt"></i>
                    <h3>Proveedor Fiable Vimeus</h3>
                    <p>Integración directa con la infraestructura de alta disponibilidad de Vimeus.net.</p>
                </div>
                <div class="feature-card">
                    <i class="fa-solid fa-circle-play"></i>
                    <h3>Reproducción Dual</h3>
                    <p>Streams nativos M3U8 para el reproductor interno de Stremio y Web Embeds oficiales.</p>
                </div>
                <div class="feature-card">
                    <i class="fa-solid fa-language"></i>
                    <h3>Audio Latino / Castellano</h3>
                    <p>Máxima fidelidad en Full HD con doblajes en español latino y castellano.</p>
                </div>
            </div>
        </div>

        <footer>
            <span>Creado con ❤️ para Stremio • Desarrollado por Antigravity</span>
            <div>
                <a href="${manifestUrl}" target="_blank">Ver manifest.json <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 9px;"></i></a>
            </div>
        </footer>
    </div>

    <script>
        function copyManifestUrl() {
            const copyText = document.getElementById("manifest-url");
            copyText.select();
            copyText.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyText.value);

            const btn = document.querySelector('.copy-btn');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiado!';
            btn.style.background = '#dc2626';
            
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar';
                btn.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(153, 27, 27, 0.2))';
            }, 2500);
        }
    </script>
</body>
</html>
  `;
}

// Landing page route
app.get('/', (req, res) => {
  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(getLandingPageHtml(host, protocol));
});

// Stremio manifest route
app.get('/manifest.json', (req, res) => {
  res.json(MANIFEST);
});

// Real-time redirect play route using the download.service.js resolveEmbedUrl function
app.get('/play/direct', async (req, res) => {
  const { url, id } = req.query;
  if (!url) {
    return res.status(400).send('Falta el parámetro url');
  }

  console.log(`[miColita ESP] [/play/direct] Request to resolve direct link for: ${id} (${url})`);

  try {
    const directUrl = await resolveToDirectLink(url, url);
    if (directUrl) {
      console.log(`[miColita ESP] [/play/direct] Redirecting to direct stream: ${directUrl.substring(0, 100)}...`);
      return res.redirect(302, directUrl);
    }
  } catch (err) {
    console.error(`[miColita ESP] [/play/direct] Failed resolving embed to direct link:`, err.message);
  }

  console.log(`[miColita ESP] [/play/direct] Redirecting to fallback external url: ${url}`);
  return res.redirect(302, url);
});

// TMDB metadata and ID helper
const tmdbApiKeys = [
  "b573d051ec65413c949e68169923f7ff",
  "da40aaeca884d8c9a9a4c088917c474c"
];

async function getTmdbInfo(imdbId, type) {
  const resolvedType = type === 'movie' ? 'movie' : 'tv';
  for (const apiKey of tmdbApiKeys) {
    try {
      const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id&language=es-MX`;
      const response = await axios.get(url, { timeout: 4000 });
      const data = response.data;
      if (data) {
        const tvResults = data.tv_results || [];
        const movieResults = data.movie_results || [];
        if (tvResults.length > 0) {
          return {
            tmdbId: tvResults[0].id,
            spanishTitle: tvResults[0].name || null
          };
        }
        if (movieResults.length > 0) {
          return {
            tmdbId: movieResults[0].id,
            spanishTitle: movieResults[0].title || null
          };
        }
      }
    } catch (e) {
      // Fail silently to try next key
    }
  }
  return { tmdbId: null, spanishTitle: null };
}

// Universal Stremio Stream Route supporting all prefixes
app.get('/stream/:type/:id.json', async (req, res) => {
  let { type, id } = req.params;
  id = id.replace('.json', '');

  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;

  console.log(`[miColita ESP] Stream request - Type: ${type}, ID: ${id}`);

  let imdbId = '';
  let season = 1;
  let episode = 1;

  if (id.startsWith('tt')) {
    const parts = id.split(':');
    imdbId = parts[0];
    if (parts.length >= 3) {
      season = parseInt(parts[1] || '1', 10);
      episode = parseInt(parts[2] || '1', 10);
    }
  } else {
    // We only support Cinemeta IMDb IDs
    return res.json({ streams: [] });
  }

  try {
    const meta = await getContentMeta(imdbId, type);
    if (!meta || !meta.name) {
      console.log(`[miColita ESP] Could not resolve metadata for ID: ${imdbId}`);
      return res.json({ streams: [] });
    }

    const title = meta.name;
    const year = meta.year || '';
    console.log(`[miColita ESP] Resolved Cinemeta title: "${title}" (${year})`);

    // Fetch TMDb ID and Spanish title for highest Vimeus resolution accuracy
    let tmdbId = meta.moviedb_id || null;
    let spanishTitle = null;
    try {
      const tmdbInfo = await getTmdbInfo(imdbId, type);
      if (tmdbInfo.tmdbId) tmdbId = tmdbInfo.tmdbId;
      spanishTitle = tmdbInfo.spanishTitle;
      if (tmdbId) {
        console.log(`[miColita ESP] Resolved TMDb ID: ${tmdbId}, Spanish title: "${spanishTitle || ''}"`);
      }
    } catch (e) {
      console.error(`[miColita ESP] TMDB Info Error:`, e.message);
    }

    // Resolve streams from Vimeus
    const streams = await getContentStreams(
      spanishTitle || title,
      year,
      type,
      season,
      episode,
      host,
      protocol,
      imdbId,
      tmdbId
    );

    return res.json({ streams });
  } catch (err) {
    console.error(`[miColita ESP] Error processing streams for ${id}:`, err.message);
    return res.json({ streams: [] });
  }
});

module.exports = app;
