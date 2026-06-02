# miColita Esp - Stremio Addon

**miColita Esp** es un addon de Stremio premium, rápido y ligero, diseñado específicamente para la comunidad hispanohablante. Integra en tiempo real los extensos catálogos de películas y series en español de **LaMovie.org** y **TioPlus.app**, resolviendo enlaces de video directos de múltiples servidores (como VOE, Vidhide/Callistanise/Earnvids, Turbovid, P2P, Upfast y más) para ofrecer una reproducción nativa, fluida y completamente libre de anuncios.

---

## 🌟 Características de miColita Esp

- **Multiproveedor Paralelo (LaMovie + TioPlus):** Consulta simultánea en paralelo de películas y series en milisegundos para garantizar la máxima disponibilidad de enlaces y opciones.
- **Reproducción Nativa [NATIVO]:** Resolvedor inteligente en tiempo real que extrae el flujo de video crudo (`.m3u8` o `.mp4`) de los servidores de alojamiento y redirige a Stremio, permitiendo la reproducción interna nativa sin abrir navegadores.
- **Sin Publicidad ni Popups:** Olvídate de los molestos redireccionamientos publicitarios de las webs de streaming tradicionales; el addon filtra y entrega únicamente el archivo de video.
- **Mapeo Universal de IDs (Cinemeta):** Traduce automáticamente los IDs de IMDb (`ttXXXXXX`) de Stremio a títulos y episodios correctos mediante búsquedas dinámicas y concordancia inteligente (fuzzy matching) asistida por TMDB para títulos en español.
- **Página de Inicio Premium:** Interfaz web interactiva rediseñada con estética premium de cine, modo oscuro inmersivo, efecto de cristal (glassmorphism), botón de instalación directa e indicador dinámico del manifest.
- **Arquitectura Serverless Ready:** Diseño ultraligero que elimina la necesidad de levantar navegadores en la mayoría de flujos, lo que lo hace perfecto y estable para despliegues gratuitos de por vida en Vercel.

---

## 🛠️ Cómo ejecutar de forma Local (En tu PC)

### Prerrequisitos
Debes tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

### Pasos
1. Abre tu terminal en la carpeta del proyecto.
2. Instala las dependencias del proyecto ejecutando:
   ```bash
   pnpm install
   ```
   *(o `npm install` si prefieres)*
3. Inicia el servidor de desarrollo local con:
   ```bash
   npm start
   ```
4. Verás el siguiente mensaje en tu consola:
   ```text
   ====================================================
   🚀 Addon miColita Esp corriendo en el puerto 7000
   ====================================================
   Página de Inicio: http://localhost:7000/
   Manifest URL:    http://localhost:7000/manifest.json
   ====================================================
   ```

---

## 🐳 Despliegue en VPS (Docker Compose)

El proyecto incluye una configuración optimizada de `docker-compose.yml` para desplegar el addon junto con un túnel de Cloudflare en tu VPS de forma segura y automatizada:

```bash
docker-compose up -d
```

Este servicio (`micoesp-stre`) instalará automáticamente Chromium y las dependencias del sistema necesarias en el contenedor de Node.js, clonará/actualizará el repositorio, e iniciará el addon en el puerto `7002` (mapeado al `7000` interno) protegido y expuesto públicamente a través de Cloudflare Tunnel.

---

## ☁️ Cómo publicar GRATIS en Vercel

Vercel es la opción ideal para alojar este addon de forma gratuita, estable, rápida y de por vida gracias a su consumo ligero de recursos (llamadas API directas).

1. Sube este proyecto a tu repositorio personal de GitHub.
2. Ve a [Vercel](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **"Add New..." -> "Project"**.
4. Importa el repositorio de tu addon y haz clic en **"Deploy"**.
5. ¡Listo! Vercel te dará una URL pública gratuita como `https://micolita-esp-stremio.vercel.app`.

---

## 📁 Estructura del Código

- `api/index.js`: El corazón del addon. Maneja las rutas Stremio (`/manifest.json`, `/stream/:type/:id.json`), la página de inicio y coordina las búsquedas y fusiones en paralelo.
- `api/scraper/lamovie.service.js`: Módulo de comunicación directa con LaMovie.org para buscar contenido y obtener enlaces embeds.
- `api/scraper/tioplus.service.js`: Módulo de comunicación ultrarrápido sin Puppeteer con la API de búsqueda y player de TioPlus.app para resolver tokens en tiempo real.
- `api/scraper/download.service.js`: resolvedor de enlaces directos (extrae el video directo de VOE, Vidhide, Turbovid, Upfast, etc.).
- `index.js`: El arrancador local para desarrollo rápido en PC (`npm start`).
- `docker-compose.yml`: Orquestador de contenedores Docker para tu entorno de producción en VPS.
- `vercel.json`: Configura las rutas para el procesamiento serverless en la plataforma Vercel.

---

¡Disfruta de tus películas y series favoritas en audio español con **miColita Esp**! 🎬🍿
