import { test, expect } from '@playwright/test';
import { cotizacionValida } from './rutas';

test.describe('Política de privacidad', () => {
  test('existe, se indexa y está enlazada desde el pie', async ({ page }) => {
    await page.goto('/');
    const enlace = page.locator('footer a[href="/privacidad/"]');
    await expect(enlace).toHaveCount(1);

    const respuesta = await page.goto('/privacidad/');
    expect(respuesta?.status()).toBe(200);
    // A diferencia de /gracias, esta SÍ debe indexarse.
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test('cubre los puntos que la LOPDP obliga a declarar', async ({ page }) => {
    await page.goto('/privacidad/');
    const texto = (await page.locator('main').textContent())!.toLowerCase();

    for (const obligatorio of [
      'responsable',
      'finalidad',
      'conserv',
      'transferencia internacional',
      'acceso',
      'rectificación',
      'eliminación',
      'oposición',
      'portabilidad',
      'resend',
      'cloudflare',
    ]) {
      expect(texto, `falta cubrir "${obligatorio}"`).toContain(obligatorio);
    }
  });

  test('aparece en el sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap-0.xml')).text();
    expect(xml).toContain('/privacidad/');
  });
});

test.describe('Consentimiento', () => {
  test('la casilla arranca SIN marcar y enlaza a la política', async ({ page }) => {
    await page.goto('/contacto/');
    const casilla = page.locator('#privacidad');
    // Una casilla premarcada no vale como consentimiento.
    await expect(casilla).not.toBeChecked();
    await expect(casilla).toHaveAttribute('required', '');
    await expect(page.locator('label[for="privacidad"] a[href="/privacidad/"]')).toHaveCount(1);
  });

  test('sin marcarla no sale ninguna petición de red', async ({ page }) => {
    const peticiones: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/cotizacion')) peticiones.push(r.method());
    });

    await page.goto('/contacto/');
    await page.fill('#nombre', 'Byron Herrera');
    await page.fill('#email', 'byron@ejemplo.com');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(600);

    expect(peticiones).toHaveLength(0);
    await expect(page.locator('[data-error-de="privacidad"]')).toBeVisible();
  });

  test('el SERVIDOR también lo exige, no solo el HTML', async ({ request }) => {
    // El `required` del HTML se salta con dos clics en devtools o con un curl.
    // Sin consentimiento probado no hay base legal para tratar el dato.
    const sinConsentimiento = { ...cotizacionValida };
    delete (sinConsentimiento as Record<string, unknown>).privacidad;

    const r = await request.post('/api/cotizacion', { data: sinConsentimiento });
    expect(r.status()).toBe(400);
    expect((await r.json()).campos).toHaveProperty('privacidad');
  });

  test('con la casilla marcada el envío procede', async ({ page }) => {
    await page.route('**/api/cotizacion', (ruta) =>
      ruta.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.goto('/contacto/');
    await page.fill('#nombre', 'Byron Herrera');
    await page.fill('#email', 'byron@ejemplo.com');
    await page.check('#privacidad');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/gracias/');
  });
});

test.describe('Local y mapa', () => {
  test('el JSON-LD declara LocalBusiness con la dirección', async ({ page }) => {
    await page.goto('/');
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const entidad = schemas
      .map((s) => JSON.parse(s))
      .find((s) => s['@type'] === 'LocalBusiness' || s['@type'] === 'Organization');

    expect(entidad).toBeTruthy();
    test.skip(entidad['@type'] !== 'LocalBusiness', 'Sin local configurado en Sanity');

    expect(entidad.address.streetAddress, 'LocalBusiness sin calle').toBeTruthy();
    expect(entidad.address.addressLocality).toBeTruthy();
    expect(entidad.address.addressCountry).toBe('EC');
    // Una sola entidad: LocalBusiness ES un Organization, no van las dos por separado.
    const organizaciones = schemas.map((s) => JSON.parse(s)).filter((s) => s['@type'] === 'Organization');
    expect(organizaciones, 'hay Organization y LocalBusiness compitiendo').toHaveLength(0);
  });

  test('el mapa NO carga nada de Google hasta que se pulsa', async ({ page }) => {
    const externas: string[] = [];
    page.on('request', (r) => {
      const host = new URL(r.url()).hostname;
      if (host !== 'localhost') externas.push(host);
    });

    await page.goto('/contacto/', { waitUntil: 'networkidle' });
    const mapa = page.locator('#mapa-local');
    test.skip((await mapa.count()) === 0, 'Sin mapa configurado en Sanity');

    // Antes del clic: ni un byte a Google. Es lo que sostiene lo que afirma
    // la política de privacidad sobre terceros.
    expect(externas.filter((h) => h.includes('google'))).toHaveLength(0);
    await expect(page.locator('#mapa-local iframe')).toHaveCount(0);

    await mapa.locator('[data-abrir-mapa]').click();
    // Tras el clic, el iframe existe y la fachada desaparece.
    await expect(page.locator('iframe[title*="ubicación"]')).toHaveCount(1);
    await expect(page.locator('[data-abrir-mapa]')).toHaveCount(0);
  });
});
