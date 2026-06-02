const express = require('express');
const cors = require('express'); // Wait, the original imported cors but let's make sure it's the cors library: const cors = require('cors');
const axios = require('axios');

// Using the actual cors package
const corsMiddleware = require('cors');

// Scraper services
const { resolveEmbedUrl } = require('./scraper/download.service');
const lamovieService = require('./scraper/lamovie.service');
const tioplusService = require('./scraper/tioplus.service');

const app = express();
app.use(corsMiddleware());

// Addon Manifest Definition for miColita Esp
const MANIFEST = {
  id: 'org.micolita.esp.addon',
  version: '1.3.0',
  name: 'miColita Esp',
  description: 'Addon de Stremio premium para ver Películas y Series en Español de LaMovie y TioPlus. Enlaces directos sin publicidad y reproducción nativa.',
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
    if (directUrl) {
      console.log(`[miColita ESP] [Direct] Successfully resolved direct URL: ${directUrl.substring(0, 120)}...`);
      directLinkCache.set(id, { url: directUrl, timestamp: now });
      return directUrl;
    }
  } catch (err) {
    console.error(`[miColita ESP] [Direct] Error resolving embed to direct link:`, err.message);
  }
  return null;
}

// Fetch streams from LaMovie & TioPlus scrapers in parallel
async function getContentStreams(title, year, type, season, episode, host, protocol) {
  const cacheKey = type === 'movie' 
    ? `${cleanName(title)}:${year || 'any'}`
    : `${cleanName(title)}:S${season}E${episode}`;

  const cached = streamCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL_STREAMS)) {
    console.log(`[miColita ESP] [Cache] Streams loaded from cache for key: ${cacheKey}`);
    return cached.data;
  }

  const streams = [];
  try {
    console.log(`[miColita ESP] [Scraper] Resolving streams for: "${title}" (${year || ''}), Type: ${type}`);
    
    // Fetch from both sources in parallel to keep execution sub-second/realtime-ready
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
      // Sort embeds by playback reliability (non-IP locked servers like VOE first, followed by others)
      mergedEmbeds.sort((a, b) => {
        const getScore = (embed) => {
          const u = embed.url.toLowerCase();
          const s = (embed.server || '').toLowerCase();
          
          // 1. VOE is the most reliable (no IP locking)
          if (u.includes('voe')) return 100;
          
          // 2. Vidhide / Earnvids / Callistanise are extremely fast and reliable
          if (u.includes('vidhide') || u.includes('callistanise') || u.includes('earnvids') || s.includes('earnvids')) return 80;
          
          // 3. Filemoon and Mixdrop
          if (u.includes('filemoon')) return 70;
          if (u.includes('mixdrop')) return 65;
          
          // 4. Streamwish
          if (u.includes('hlswish') || u.includes('streamwish')) return 60;
          
          // 5. Goodstream and Vimeos
          if (u.includes('goodstream')) return 50;
          if (u.includes('vimeos')) return 40;
          
          // 6. TioPlus Turbovid
          if (u.includes('turbovid') || s.includes('tioplus')) return 30;
          
          // 7. Light servers (P2P, Upfast, Player, RPM)
          if (s.includes('p2p')) return 20;
          if (s.includes('upfast') || u.includes('upns.pro')) return 18;
          if (s.includes('player') || u.includes('4meplayer.pro')) return 15;
          if (s.includes('rpm') || u.includes('rpmstream')) return 12;
          
          return 1;
        };
        return getScore(b) - getScore(a);
      });

      mergedEmbeds.forEach((embed) => {
        // Resolve clean server name based on domain
        let serverName = 'Online';
        try {
          const hostName = new URL(embed.url).hostname.toLowerCase();
          if (hostName.includes('voe')) serverName = 'VOE';
          else if (hostName.includes('vimeos')) serverName = 'Vimeos';
          else if (hostName.includes('goodstream')) serverName = 'Goodstream';
          else if (hostName.includes('hlswish') || hostName.includes('streamwish')) serverName = 'Streamwish';
          else if (hostName.includes('filemoon')) serverName = 'Filemoon';
          else if (hostName.includes('vidhide') || hostName.includes('callistanise') || hostName.includes('earnvids')) serverName = 'Vidhide';
          else if (hostName.includes('turbovid')) serverName = 'Turbovid';
          else if (embed.server) serverName = embed.server;
        } catch (e) {
          if (embed.server) serverName = embed.server;
        }
        
        serverName = serverName.toUpperCase();
        
        const langName = (embed.lang || 'Latino').toUpperCase();
        const qualityName = (embed.quality || 'HD').toUpperCase();
        const sourceTag = embed.source || 'ADDON';
        
        const playDirectUrl = `${protocol}://${host}/play/direct?url=${encodeURIComponent(embed.url)}&id=${cleanName(title)}_${type === 'movie' ? 'movie' : 'S' + season + 'E' + episode}_${cleanName(serverName)}_${sourceTag}`;

        // 1. [NATIVO] Direct play redirect stream (plays inside Stremio)
        streams.push({
          name: `miColita\nEsp`,
          type: 'url',
          title: `⭐ [NATIVO] [${langName}] ${serverName} (${qualityName}) [${sourceTag}]\n🎬 Reproducción nativa en reproductor interno\n⚡ Resolvedor inteligente de video en tiempo real`,
          url: playDirectUrl
        });

        // 2. [EMBED] Standard redirect embed (opens in browser as backup)
        streams.push({
          name: `miColita\nEsp`,
          type: 'embed',
          title: `🔗 [EMBED] [${langName}] ${serverName} (${qualityName}) [${sourceTag}]\n🌐 Abre en el navegador (Opción tradicional)`,
          externalUrl: embed.url
        });
      });
    }
  } catch (err) {
    console.error(`[miColita ESP] [Scraper] Error getting streams:`, err.message);
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
    <meta name="description" content="Addon premium de Stremio para ver películas y series en español de LaMovie y TioPlus de forma nativa, veloz y sin publicidad.">
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
                    <i class="fa-solid fa-cubes"></i>
                    <h3>Multiproveedor Premium</h3>
                    <p>Acceso integrado a los catálogos en español de LaMovie.org y TioPlus.app en paralelo.</p>
                </div>
                <div class="feature-card">
                    <i class="fa-solid fa-language"></i>
                    <h3>Audio Latino / Castellano</h3>
                    <p>Soporte de múltiples variantes de doblajes en español e idiomas originales.</p>
                </div>
                <div class="feature-card">
                    <i class="fa-solid =fa-circle-play"></i>
                    <h3>Reproducción Directa</h3>
                    <p>Conversión en tiempo real a enlaces M3U8/MP4 para reproducir directamente en la app sin anuncios.</p>
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

// TMDB Spanish title translation helper
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

    // Try to get Spanish title from TMDB
    let spanishTitle = null;
    try {
      spanishTitle = await getSpanishTitle(imdbId, type);
      if (spanishTitle) {
        console.log(`[miColita ESP] Resolved Spanish title from TMDB: "${spanishTitle}"`);
      }
    } catch (e) {
      console.error(`[miColita ESP] TMDB Translation Error:`, e.message);
    }

    // Try fetching with Spanish title first
    let streams = [];
    if (spanishTitle && cleanName(spanishTitle) !== cleanName(title)) {
      streams = await getContentStreams(spanishTitle, year, type, season, episode, host, protocol);
    }

    // Fallback/alternative: if no streams found or no Spanish title, use English/Cinemeta title
    if (streams.length === 0) {
      streams = await getContentStreams(title, year, type, season, episode, host, protocol);
    }

    return res.json({ streams });
  } catch (err) {
    console.error(`[miColita ESP] Error processing streams for ${id}:`, err.message);
    return res.json({ streams: [] });
  }
});

module.exports = app;
