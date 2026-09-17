import type { Page } from '@playwright/test';
import { navPrincipal } from '../src/lib/nav';

/**
 * Las rutas salen de la MISMA fuente que el menú del sitio. Si alguien añade una
 * página al nav, la suite la prueba sola: no hay una segunda lista que mantener.
 *
 * Con barra final porque wrangler redirige 307 de /ruta a /ruta/, y perseguir
 * redirecciones enmascararía un 404 real.
 */
export const rutasDelNav = navPrincipal.map((item) =>
  item.href === '/' ? '/' : `${item.href}/`
);

/**
 * Las páginas de proyecto dependen de lo que haya publicado en Sanity, así que se
 * descubren en vez de listarse. Si el portafolio está vacío, devuelve [] y las
 * pruebas que dependen de ellas se saltan con un motivo explícito.
 */
export async function rutasDeProyectos(page: Page): Promise<string[]> {
  await page.goto('/portafolio/', { waitUntil: 'domcontentloaded' });
  return page.$$eval('main a[href^="/portafolio/"]', (enlaces) =>
    [...new Set(enlaces.map((a) => new URL((a as HTMLAnchorElement).href).pathname))].filter(
      (ruta) => ruta !== '/portafolio/'
    )
  );
}

/** Un payload válido del formulario de cotización. */
export const cotizacionValida = {
  nombre: 'Byron Herrera',
  email: 'byron@ejemplo.com',
  telefono: '0991234567',
  servicioInteres: '',
  mensaje: 'Quiero cotizar el rediseño de mi marca.',
  honeypot: '',
};
