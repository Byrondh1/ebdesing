// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import registrarSalida from './integraciones/registrar-salida.mjs';

/**
 * ⚠ DOMINIO PROVISIONAL — EBDesing todavía no lo ha decidido (confirmado 2026-09-17).
 *
 * No está confirmado que vaya a ser este. De aquí salen los canonical, el sitemap,
 * el robots.txt y las URLs absolutas del JSON-LD, así que hay que fijarlo ANTES del
 * primer deploy: publicar con el dominio equivocado deja canonical apuntando a un
 * sitio que no es el nuestro.
 *
 * Ningún artefacto generado lo da por bueno: las imágenes OG no lo imprimen y el
 * robots.txt lo deriva de aquí. `npm run marcadores` lo reporta como bloqueante.
 */
const DOMINIO_PROVISIONAL = 'https://ebdesing.com';

// Rutas que no deben indexarse ni aparecer en el sitemap.
const EXCLUIDAS = ['/components-preview', '/404'];

/**
 * Variables que se necesitan DURANTE el build (al generar las páginas).
 *
 * Con el adaptador de Cloudflare, Astro prerenderiza dentro de un sandbox Miniflare
 * que no tiene `process.env`. Y `import.meta.env` no es un objeto consultable en
 * runtime: Vite lo sustituye textualmente, así que `import.meta.env[variable]` con
 * un nombre dinámico NUNCA se resuelve. Por eso se inyectan una a una aquí.
 *
 * NO metas secretos en esta lista: lo que entra aquí queda escrito en el bundle.
 * RESEND_API_KEY y CONTACT_EMAIL son de runtime y se leen en el endpoint desde
 * `locals.runtime.env`.
 */
const VARIABLES_DE_BUILD = [
  'SANITY_PROJECT_ID',
  'SANITY_DATASET',
  'SANITY_API_VERSION',
  'USAR_CONTENIDO_LOCAL',
  'CF_PAGES',
  'WORKERS_CI',
];

// loadEnv con prefijo vacío junta los ficheros .env y las variables del proceso.
const entorno = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

const inyectadas = Object.fromEntries(
  VARIABLES_DE_BUILD.map((nombre) => [
    `import.meta.env.${nombre}`,
    JSON.stringify(entorno[nombre] ?? ''),
  ])
);

// https://astro.build/config
export default defineConfig({
  site: DOMINIO_PROVISIONAL,

  // El sitio entero se prerenderiza. La única ruta que se ejecuta en el servidor es
  // /api/cotizacion, que se marca con `export const prerender = false`. El adaptador
  // hace falta para poder ejecutar esa sola ruta en el edge de Cloudflare.
  output: 'static',
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [
    // Deja el directorio real del build en .astro/salida-build.json para que las
    // auditorías del postbuild no tengan que adivinarlo.
    registrarSalida(),
    sitemap({
      filter: (pagina) =>
        !EXCLUIDAS.some((ruta) => pagina === `${DOMINIO_PROVISIONAL}${ruta}/` || pagina === `${DOMINIO_PROVISIONAL}${ruta}`),
      changefreq: 'monthly',
      lastmod: new Date(),
    }),
  ],
  vite: {
    // Tailwind 4 se integra vía el plugin de Vite, NO vía @astrojs/tailwind (ese es de Tailwind 3).
    plugins: [tailwindcss()],
    define: inyectadas,
  },
});
