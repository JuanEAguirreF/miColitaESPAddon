# miColita Esp - Stremio Addon

**miColita Esp** es un addon de Stremio premium, rápido y ligero, diseñado específicamente para la comunidad hispanohablante. Utiliza **Vimeus.net** como proveedor principal y fiable de streaming, ofreciendo reproducción dual (stream nativo M3U8 para el reproductor interno de Stremio y Web Embed oficial para el navegador), con máxima estabilidad, audio en español y libre de publicidad.

---

## 🌟 Características de miColita Esp

- **Proveedor Fiable (Vimeus.net):** Conexión directa a los endpoints de Vimeus con soporte directo para IDs de IMDb y TMDb, garantizando respuesta instantánea y enlaces activos.
- **Reproducción Dual:**
  - **[NATIVO]:** Resolvedor instantáneo de M3U8 en tiempo real (desempaquetado Dean Edwards en < 50ms) para reproducción fluida dentro del reproductor de Stremio.
  - **[EMBED]:** Enlace directo al reproductor web oficial de Vimeus como opción de respaldo.
- **Sin Publicidad ni Popups:** Olvídate de los molestos redireccionamientos publicitarios de las webs de streaming tradicionales; el addon entrega directamente el flujo de video limpio.
- **Soporte de Películas y Series:** Resolución de películas y episodios específicos por temporada (`SxxExx`) con fallback para series y anime.
- **Página de Inicio Premium:** Interfaz web interactiva con estética de cine, modo oscuro inmersivo, efecto de cristal (glassmorphism), botón de instalación directa e indicador dinámico del manifest.
- **Arquitectura Serverless Ready:** Diseño ultraligero sin sobrecarga de Puppeteer en el flujo principal, perfecto para despliegues gratuitos y estables en Vercel o VPS.

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

- `api/index.js`: El corazón del addon. Maneja las rutas Stremio (`/manifest.json`, `/stream/:type/:id.json`), la página de inicio y coordina la entrega de streams duales (nativo + embed).
- `api/scraper/vimeus.service.js`: Módulo de integración principal con Vimeus.net. Maneja consultas de películas, series y episodios por IMDb/TMDb IDs y desempacado de streams HLS.
- `api/scraper/download.service.js`: Resolvedor de enlaces directos (optimizado con desempaquetado de M3U8 de Vimeus/Vimeos).
- `api/scraper/lamovie.service.js` y `tioplus.service.js`: Módulos de proveedores anteriores (conservados y comentados en el index para referencia futura).
- `index.js`: El arrancador local para desarrollo rápido en PC (`npm start`).
- `docker-compose.yml`: Orquestador de contenedores Docker para tu entorno de producción en VPS.
- `vercel.json`: Configura las rutas para el procesamiento serverless en la plataforma Vercel.

---

¡Disfruta de tus películas y series favoritas en audio español con **miColita Esp**! 🎬🍿
