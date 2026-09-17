// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Tailwind 4 se integra vía el plugin de Vite, NO vía @astrojs/tailwind (ese es de Tailwind 3).
export default defineConfig({
  // TODO(Byron): cambiar por el dominio real antes del deploy (§12).
  // De esto dependen los canonical y, en el paso 9, el sitemap.
  site: 'https://ebdesing.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
