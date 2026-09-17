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
