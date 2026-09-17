import { defineConfig, devices } from '@playwright/test';

/**
 * Suite E2E y de accesibilidad (paso 12 del BUILD ORDER).
 *
 * El servidor lo levanta Playwright: construye y sirve el build real, no `astro dev`,
 * porque lo que se publica es el build. Se reconstruye en cada ejecución a propósito
 * (ver `reuseExistingServer` más abajo).
 *
 * El build hereda el entorno: con .env configurado usa Sanity; con
 * USAR_CONTENIDO_LOCAL=1 usa el contenido de ejemplo. La suite funciona igual en
 * ambos casos porque descubre las rutas en vez de darlas por sabidas.
 */
export default defineConfig({
  testDir: './pruebas',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // 360px es el ancho de diseño del proyecto: mobile-first de verdad.
    {
      name: 'movil',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 780 }, isMobile: false },
    },
  ],

  webServer: {
    // No se usa `npm run preview` directamente: astro preview se demoniza y Playwright
    // aborta con "webServer exited early". El envoltorio se queda en primer plano y
    // para el servidor al terminar la suite. Ver scripts/servidor-pruebas.mjs.
    command: 'npm run build && node scripts/servidor-pruebas.mjs',
    url: 'http://localhost:4321/',
    // Nunca se reutiliza un servidor ya levantado, ni en local. Aquí el servidor
    // sirve un build, no código en vivo: reutilizarlo hace que la suite pase contra
    // un dist/ viejo y dé por buenos cambios que no se han compilado. Ya pasó.
    // El coste es reconstruir en cada ejecución; la alternativa es un verde que miente.
    reuseExistingServer: false,
    timeout: 240_000,
    // Margen para que el envoltorio pare el servidor demonizado antes de morir.
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
  },
});
