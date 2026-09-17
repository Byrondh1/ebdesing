// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * TODO(Byron): `site` sigue siendo un marcador. De él dependen los canonical, el
 * sitemap y las URLs absolutas del JSON-LD, así que debe ser el dominio definitivo
 * ANTES del primer deploy. Cambiarlo después obliga a regenerar las imágenes OG.
 */
const SITIO = 'https://ebdesing.com';

// Rutas que no deben indexarse ni aparecer en el sitemap.
const EXCLUIDAS = ['/components-preview', '/404'];

// https://astro.build/config
export default defineConfig({
  site: SITIO,
  integrations: [
    sitemap({
      filter: (pagina) =>
        !EXCLUIDAS.some((ruta) => pagina === `${SITIO}${ruta}/` || pagina === `${SITIO}${ruta}`),
      changefreq: 'monthly',
      lastmod: new Date(),
    }),
  ],
  vite: {
    // Tailwind 4 se integra vía el plugin de Vite, NO vía @astrojs/tailwind (ese es de Tailwind 3).
    plugins: [tailwindcss()],
  },
});
