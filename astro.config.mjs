// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Tailwind 4 se integra vía el plugin de Vite, NO vía @astrojs/tailwind (ese es de Tailwind 3).
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
