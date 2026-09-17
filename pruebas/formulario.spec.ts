import { test, expect, type Page } from '@playwright/test';

/**
 * Comportamiento del formulario en el navegador.
 *
 * Las respuestas del endpoint se simulan con page.route (el blueprint §13 lo llama
 * "mockeando Resend"): así se prueban los tres estados de la interfaz — éxito, error
 * de validación del servidor y caída — sin depender de credenciales.
 */

const contarPeticiones = (page: Page) => {
  const peticiones: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/cotizacion')) peticiones.push(r.method());
  });
  return peticiones;
};

const rellenarValido = async (page: Page) => {
  await page.fill('#nombre', 'Byron Herrera');
  await page.fill('#email', 'byron@ejemplo.com');
  await page.fill('#mensaje', 'Quiero cotizar el rediseño de mi marca.');
};

test.describe('Formulario de cotización', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacto/');
  });

  test('con campos obligatorios vacíos NO se hace ninguna petición de red', async ({ page }) => {
    const peticiones = contarPeticiones(page);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Este es el "Done when" del paso 8: la validación del navegador corta antes de la red.
    expect(peticiones, 'no debería salir ninguna petición').toHaveLength(0);
    await expect(page.locator('[data-error-de="nombre"]')).toBeVisible();
    await expect(page.locator('#nombre')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#nombre')).toBeFocused();
  });

  test('con el correo mal formado tampoco se toca la red', async ({ page }) => {
    const peticiones = contarPeticiones(page);
    await page.fill('#nombre', 'Byron Herrera');
    await page.fill('#email', 'esto-no-es-un-correo');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    expect(peticiones).toHaveLength(0);
    await expect(page.locator('[data-error-de="email"]')).toBeVisible();
  });

  test('envío correcto: un POST, mensaje de éxito y formulario limpio', async ({ page }) => {
    await page.route('**/api/cotizacion', (ruta) =>
      ruta.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    const peticiones = contarPeticiones(page);

    await rellenarValido(page);
    await page.click('button[type="submit"]');

    await expect(page.locator('#estado-cotizacion')).toBeVisible();
    await expect(page.locator('#estado-cotizacion')).toContainText(/recibido/i);
    expect(peticiones).toEqual(['POST']);
    await expect(page.locator('#nombre')).toHaveValue('');
  });

  test('si el servidor rechaza un campo, el error aparece junto a ese campo', async ({ page }) => {
    await page.route('**/api/cotizacion', (ruta) =>
      ruta.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, campos: { email: 'Ese correo no existe.' } }),
      })
    );

    await rellenarValido(page);
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-error-de="email"]')).toContainText('Ese correo no existe.');
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('si el envío falla, se ofrece WhatsApp para no perder el contacto', async ({ page }) => {
    await page.route('**/api/cotizacion', (ruta) =>
      ruta.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false}' })
    );

    await rellenarValido(page);
    await page.click('button[type="submit"]');

    const estado = page.locator('#estado-cotizacion');
    await expect(estado).toBeVisible();
    await expect(estado.locator('a[href^="https://wa.me/"]')).toHaveCount(1);
  });

  test('el botón se bloquea mientras se envía y se recupera después', async ({ page }) => {
    await page.route('**/api/cotizacion', async (ruta) => {
      await new Promise((r) => setTimeout(r, 400));
      await ruta.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await rellenarValido(page);
    const boton = page.locator('button[type="submit"]');
    await boton.click();

    await expect(boton).toBeDisabled();
    await expect(boton).toContainText(/enviando/i);
    await expect(boton).toBeEnabled({ timeout: 5000 });
  });

  test('el honeypot está oculto y fuera del tabulado', async ({ page }) => {
    const honeypot = page.locator('#honeypot');
    await expect(honeypot).toHaveAttribute('tabindex', '-1');

    const caja = await honeypot.boundingBox();
    expect(caja?.width ?? 0, 'el honeypot no debe ocupar espacio visible').toBeLessThanOrEqual(2);

    // Su contenedor va aria-hidden para que un lector de pantalla no lo anuncie.
    const oculto = await honeypot.evaluate((el) => Boolean(el.closest('[aria-hidden="true"]')));
    expect(oculto).toBe(true);
  });

  test('el botón flotante de WhatsApp sigue visible al hacer scroll', async ({ page }) => {
    const flotante = page.locator('a[href^="https://wa.me/"]').last();
    await expect(flotante).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(flotante).toBeVisible();
  });
});
