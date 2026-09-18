import { test, expect } from '@playwright/test';
import { rutasDelNav, rutasDeProyectos } from './rutas';

test.describe('Navegación', () => {
  for (const ruta of rutasDelNav) {
    test(`${ruta} responde 200 y tiene una sola h1`, async ({ page }) => {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status(), `${ruta} debería responder 200`).toBe(200);

      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page).toHaveTitle(/EBDesing/);
      expect(await page.locator('link[rel="canonical"]').count()).toBeGreaterThan(0);
    });
  }

  test('una ruta inexistente devuelve 404 de verdad, no un 200 con cara de error', async ({ page }) => {
    const respuesta = await page.goto('/esta-ruta-no-existe/');
    expect(respuesta?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('no existe');
  });

  test('la página de desarrollo ya no existe ni se enlaza', async ({ page, request }) => {
    // Era temporal (paso 3 del BUILD ORDER) y se borró antes del deploy. Esta prueba
    // impide que vuelva a colarse al sitio publicado sin que nadie se dé cuenta.
    const respuesta = await page.goto('/components-preview/');
    expect(respuesta?.status()).toBe(404);

    const xml = await (await request.get('/sitemap-0.xml')).text();
    expect(xml).not.toContain('components-preview');

    await page.goto('/');
    expect(await page.locator('a[href*="components-preview"]').count()).toBe(0);
  });

  test('cada enlace del menú lleva a su página', async ({ page }) => {
    await page.goto('/');
    for (const ruta of rutasDelNav) {
      const enlace = page.locator(`header nav a[href="${ruta.replace(/\/$/, '') || '/'}"]`).first();
      await expect(enlace, `falta el enlace a ${ruta} en el menú`).toHaveCount(1);
    }
  });

  test('el pie repite la navegación y los canales de contacto', async ({ page }) => {
    await page.goto('/');
    const pie = page.locator('footer');
    await expect(pie.locator('a[href^="mailto:"]')).toHaveCount(1);
    await expect(pie.locator('a[href^="https://wa.me/"]')).toHaveCount(1);
  });

  test('las páginas de proyecto se generan y responden', async ({ page }) => {
    const rutas = await rutasDeProyectos(page);
    test.skip(rutas.length === 0, 'No hay proyectos publicados en Sanity todavía');

    for (const ruta of rutas) {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status(), `${ruta} debería responder 200`).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });

  test('el portafolio vacío lo dice, no queda en blanco', async ({ page }) => {
    const rutas = await rutasDeProyectos(page);
    test.skip(rutas.length > 0, 'Hay proyectos publicados, este caso no aplica');
    await expect(page.getByText(/todavía no hay proyectos/i)).toBeVisible();
  });

  test('no hay scroll horizontal', async ({ page }) => {
    for (const ruta of rutasDelNav) {
      await page.goto(ruta);
      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(desborde, `${ruta} se desborda ${desborde}px`).toBeLessThanOrEqual(0);
    }
  });
});

/**
 * Superficie para motores de respuesta (paso 10 del BUILD ORDER).
 *
 * El "Done when" es literal: llms.txt responde 200 y CADA URL que lista también.
 * Por eso se genera desde el contenido y no se escribe a mano — un archivo estático
 * empezaría a listar proyectos borrados en cuanto EBDesing editara el portafolio.
 */
test.describe('llms.txt', () => {
  test('responde 200 y todas las URLs que lista también', async ({ request }) => {
    const respuesta = await request.get('/llms.txt');
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()['content-type']).toContain('text/plain');

    const cuerpo = await respuesta.text();
    const urls = [...cuerpo.matchAll(/\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
    expect(urls.length, 'llms.txt debería listar enlaces').toBeGreaterThan(0);

    for (const url of urls) {
      // El archivo lleva el dominio de producción; se prueba contra el servidor local.
      const ruta = new URL(url).pathname;
      const r = await request.get(ruta);
      expect(r.status(), `${ruta} (listada en llms.txt) debería responder 200`).toBe(200);
    }
  });

  test('empieza con un resumen citable, no con una lista de enlaces', async ({ request }) => {
    const cuerpo = await (await request.get('/llms.txt')).text();
    const resumen = cuerpo
      .split('\n')
      .filter((l) => l.startsWith('> '))
      .join(' ')
      .replace(/^> /gm, '');

    expect(resumen.length, 'el resumen debería tener sustancia').toBeGreaterThan(150);
    expect(resumen).toMatch(/Ecuador/);
  });
});

test.describe('Párrafo citable', () => {
  // Cada página clave debe abrir con 2-3 frases que se sostengan solas si un motor
  // de respuesta las cita sin el resto de la página.
  for (const ruta of rutasDelNav) {
    test(`${ruta} abre con un párrafo con sustancia`, async ({ page }) => {
      await page.goto(ruta);
      const parrafo = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        let nodo = h1?.nextElementSibling ?? null;
        while (nodo && nodo.tagName !== 'P') nodo = nodo.nextElementSibling;
        return nodo?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      });

      expect(parrafo.length, `${ruta}: "${parrafo}"`).toBeGreaterThan(80);
      const frases = parrafo.split(/[.!?]\s/).filter((f) => f.trim().length > 10);
      expect(frases.length, `${ruta} debería abrir con al menos 2 frases`).toBeGreaterThanOrEqual(2);
    });
  }
});
