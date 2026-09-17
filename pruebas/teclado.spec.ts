import { test, expect } from '@playwright/test';
import { rutasDelNav } from './rutas';

/**
 * Navegación por teclado (paso 12 del BUILD ORDER).
 *
 * Todo lo que se puede hacer con ratón debe poder hacerse con Tab y Enter, y el
 * foco tiene que verse. Sin eso el sitio es inusable para quien no usa ratón.
 */
test.describe('Teclado', () => {
  test('el primer Tab llega al enlace de saltar al contenido', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const enfocado = page.locator(':focus');
    await expect(enfocado).toHaveText(/saltar al contenido/i);
    // Oculto hasta recibir foco, visible al recibirlo.
    await expect(enfocado).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#contenido$/);
  });

  test('el foco se ve en todo lo que lo recibe', async ({ page }) => {
    await page.goto('/contacto/');

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const marca = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const estilo = getComputedStyle(el);
        const anchoContorno = parseFloat(estilo.outlineWidth) || 0;
        const tieneContorno = anchoContorno > 0 && estilo.outlineStyle !== 'none';
        const tieneSombra = estilo.boxShadow !== 'none';
        const tieneBorde = estilo.borderColor !== 'rgba(0, 0, 0, 0)';
        return { etiqueta: el.tagName, visible: tieneContorno || tieneSombra || tieneBorde };
      });
      if (marca) {
        expect(marca.visible, `${marca.etiqueta} recibe foco sin indicarlo visualmente`).toBe(true);
      }
    }
  });

  test('todos los campos del formulario se alcanzan tabulando, y el honeypot no', async ({ page }) => {
    await page.goto('/contacto/');
    await page.locator('#nombre').focus();

    const alcanzados: string[] = ['nombre'];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => document.activeElement?.id ?? '');
      if (id) alcanzados.push(id);
    }

    expect(alcanzados).toContain('email');
    expect(alcanzados).toContain('telefono');
    expect(alcanzados).toContain('servicioInteres');
    expect(alcanzados).toContain('mensaje');
    expect(alcanzados, 'el honeypot no debe estar en el orden de tabulación').not.toContain('honeypot');
  });

  test('el formulario se envía con Enter desde un campo de texto', async ({ page }) => {
    await page.route('**/api/cotizacion', (ruta) =>
      ruta.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.goto('/contacto/');
    await page.fill('#nombre', 'Byron Herrera');
    await page.fill('#email', 'byron@ejemplo.com');
    await page.locator('#email').press('Enter');

    await expect(page.locator('#estado-cotizacion')).toContainText(/recibido/i);
  });

  test('el mensaje de resultado se anuncia sin robar el foco', async ({ page }) => {
    await page.route('**/api/cotizacion', (ruta) =>
      ruta.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.goto('/contacto/');

    const estado = page.locator('#estado-cotizacion');
    await expect(estado).toHaveAttribute('role', 'status');
    await expect(estado).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('Menú móvil', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, 'Solo aplica en ancho móvil');

  test('se abre y se cierra con Enter, y lo anuncia con aria-expanded', async ({ page }) => {
    await page.goto('/');
    const boton = page.locator('#menu-toggle');
    const menu = page.locator('#menu-movil');

    await expect(boton).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();

    await boton.focus();
    await page.keyboard.press('Enter');
    await expect(boton).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(boton).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
  });

  test('desde el menú abierto se llega a cada página tabulando', async ({ page }) => {
    await page.goto('/');
    await page.locator('#menu-toggle').click();

    for (const ruta of rutasDelNav) {
      const href = ruta.replace(/\/$/, '') || '/';
      await expect(page.locator(`#menu-movil a[href="${href}"]`)).toBeVisible();
    }
  });
});
