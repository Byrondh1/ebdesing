import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { rutasDelNav, rutasDeProyectos } from './rutas';

/**
 * Escaneo automático con axe (paso 12 del BUILD ORDER).
 *
 * Se falla en `critical` y `serious`, no solo en `critical`: el blueprint pide "sin
 * issues críticos", y un contraste insuficiente entra en `serious` — que es justo el
 * riesgo de una paleta de amarillo sobre negro.
 *
 * axe no sustituye a probar con un lector de pantalla de verdad; detecta lo que una
 * máquina puede detectar, que son más o menos un tercio de los problemas reales.
 */
const GRAVEDADES_QUE_FALLAN = ['critical', 'serious'];

// AxeBuilder tipa `page` con el Page de `playwright`, no con el de `@playwright/test`.
// Son estructuralmente iguales en lo que axe usa, pero TypeScript no lo sabe.
const escanear = (page: Page) =>
  new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]['page'] })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

const resumir = (violaciones: Array<{ id: string; impact?: string | null; description: string; nodes: unknown[] }>) =>
  violaciones
    .map((v) => `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} elemento/s)`)
    .join('\n');

test.describe('Accesibilidad', () => {
  for (const ruta of rutasDelNav) {
    test(`${ruta} sin problemas críticos ni graves`, async ({ page }) => {
      await page.goto(ruta);
      const { violations } = await escanear(page);
      const graves = violations.filter((v) => GRAVEDADES_QUE_FALLAN.includes(v.impact ?? ''));
      expect(graves, `\n${resumir(graves)}\n`).toEqual([]);
    });
  }

  test('el 404 también', async ({ page }) => {
    await page.goto('/esta-ruta-no-existe/');
    const { violations } = await escanear(page);
    const graves = violations.filter((v) => GRAVEDADES_QUE_FALLAN.includes(v.impact ?? ''));
    expect(graves, `\n${resumir(graves)}\n`).toEqual([]);
  });

  test('la ficha de proyecto también', async ({ page }) => {
    const rutas = await rutasDeProyectos(page);
    test.skip(rutas.length === 0, 'No hay proyectos publicados en Sanity todavía');

    await page.goto(rutas[0]);
    const { violations } = await escanear(page);
    const graves = violations.filter((v) => GRAVEDADES_QUE_FALLAN.includes(v.impact ?? ''));
    expect(graves, `\n${resumir(graves)}\n`).toEqual([]);
  });

  test('el formulario con errores visibles también', async ({ page }) => {
    // Los estados de error suelen quedarse fuera de los escaneos, y son justo donde
    // aparecen problemas: mensajes sin asociar al campo, contraste de rojo sobre blanco.
    await page.goto('/contacto/');
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-error-de="nombre"]')).toBeVisible();

    const { violations } = await escanear(page);
    const graves = violations.filter((v) => GRAVEDADES_QUE_FALLAN.includes(v.impact ?? ''));
    expect(graves, `\n${resumir(graves)}\n`).toEqual([]);
  });

  test('el menú móvil abierto también', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) >= 768, 'Solo aplica en ancho móvil');
    await page.goto('/');
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#menu-movil')).toBeVisible();

    const { violations } = await escanear(page);
    const graves = violations.filter((v) => GRAVEDADES_QUE_FALLAN.includes(v.impact ?? ''));
    expect(graves, `\n${resumir(graves)}\n`).toEqual([]);
  });
});
