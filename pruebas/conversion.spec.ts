import { test, expect } from '@playwright/test';
import { rutasDelNav, rutasDeProyectos } from './rutas';

const ES_MOVIL = (ancho?: number) => (ancho ?? 0) < 640;

test.describe('Barra de acciones móvil', () => {
  test('en móvil manda la barra; en escritorio, el flotante. Nunca los dos', async ({
    page,
    viewport,
  }) => {
    await page.goto('/');
    const barra = page.locator('#barra-movil');
    const flotante = page.locator('#whatsapp-flotante');

    if (ES_MOVIL(viewport?.width)) {
      await expect(barra).toBeVisible();
      await expect(flotante).toBeHidden();
    } else {
      await expect(flotante).toBeVisible();
      await expect(barra).toBeHidden();
    }
  });

  test('la barra no tapa el pie de página', async ({ page, viewport }) => {
    test.skip(!ES_MOVIL(viewport?.width), 'La barra solo existe en móvil');

    await page.goto('/');
    // `html` lleva scroll-smooth: un scrollTo normal se anima y la medición saldría
    // a mitad del recorrido. Se fuerza instantáneo y se espera a que pare.
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForFunction(
      () => Math.abs(window.scrollY + window.innerHeight - document.documentElement.scrollHeight) < 2
    );

    const ultimo = page.locator('footer p').last();
    await expect(ultimo).toBeVisible();

    // Con el scroll al fondo, la última línea del pie debe quedar POR ENCIMA de
    // la barra. Si el body no reserva espacio, queda detrás y no hay forma de leerla.
    const [pie, barraCaja] = await Promise.all([
      ultimo.boundingBox(),
      page.locator('#barra-movil').boundingBox(),
    ]);
    expect(pie!.y + pie!.height, 'el pie queda debajo de la barra').toBeLessThanOrEqual(barraCaja!.y + 1);
  });

  test('la barra no tapa el botón de enviar del formulario', async ({ page, viewport }) => {
    test.skip(!ES_MOVIL(viewport?.width), 'La barra solo existe en móvil');

    await page.goto('/contacto/');
    const boton = page.locator('button[type="submit"]');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
    });
    await boton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const [caja, barraCaja] = await Promise.all([
      boton.boundingBox(),
      page.locator('#barra-movil').boundingBox(),
    ]);
    expect(caja!.y + caja!.height, 'el botón queda debajo de la barra').toBeLessThanOrEqual(
      barraCaja!.y + 1
    );
    // Y debe poder pulsarse de verdad, no solo verse.
    await expect(boton).toBeEnabled();
  });
});

test.describe('Migas de pan', () => {
  const internas = rutasDelNav.filter((r) => r !== '/');

  for (const ruta of internas) {
    test(`${ruta} las muestra y el JSON-LD coincide`, async ({ page }) => {
      await page.goto(ruta);
      const migas = page.getByRole('navigation', { name: 'Migas de pan' });
      await expect(migas).toBeVisible();
      await expect(migas.getByRole('link', { name: 'Inicio' })).toHaveCount(1);

      // El camino que ve el visitante y el que lee Google deben ser el mismo.
      const visibles = (await migas.locator('li').allTextContents()).map((t) =>
        t.replace(/\s*\/\s*$/, '').trim()
      );
      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
      const breadcrumb = schemas.map((s) => JSON.parse(s)).find((s) => s['@type'] === 'BreadcrumbList');
      expect(breadcrumb, `${ruta} sin BreadcrumbList`).toBeTruthy();
      expect(breadcrumb.itemListElement.map((i: { name: string }) => i.name)).toEqual(visibles);
    });
  }

  test('el inicio NO las muestra: no hay camino que enseñar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Migas de pan' })).toHaveCount(0);
  });
});

test.describe('Preguntas frecuentes', () => {
  test('se ven, se abren, y el JSON-LD dice lo mismo que la página', async ({ page }) => {
    await page.goto('/');
    const detalles = page.locator('details');
    const total = await detalles.count();
    test.skip(total === 0, 'No hay preguntas publicadas en Sanity');

    // El contenido está en el HTML aunque esté plegado: por eso Google puede leerlo.
    const primera = detalles.first();
    await expect(primera.locator('summary')).toBeVisible();
    await primera.locator('summary').click();
    await expect(primera.locator('p')).toBeVisible();

    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = schemas.map((s) => JSON.parse(s)).find((s) => s['@type'] === 'FAQPage');
    expect(faq, 'falta el schema FAQPage').toBeTruthy();
    expect(faq.mainEntity).toHaveLength(total);

    // Marcar respuestas que el visitante no encuentra es motivo de penalización.
    const enPagina = await detalles.locator('summary').allTextContents();
    for (const item of faq.mainEntity) {
      expect(enPagina.some((t: string) => t.includes(item.name))).toBe(true);
    }
  });
});

test.describe('Enlaces internos', () => {
  test('desde un servicio se llega a sus proyectos', async ({ page }) => {
    await page.goto('/servicios/');
    const enlaces = page.locator('main a[href^="/portafolio/"]');
    const total = await enlaces.count();
    test.skip(total === 0, 'Ningún proyecto tiene servicios enlazados en Sanity');

    const destino = await enlaces.first().getAttribute('href');
    const respuesta = await page.goto(destino!);
    expect(respuesta?.status()).toBe(200);
  });

  test('desde un proyecto se vuelve a sus servicios', async ({ page }) => {
    const rutas = await rutasDeProyectos(page);
    test.skip(rutas.length === 0, 'No hay proyectos publicados');

    await page.goto(rutas[0]);
    const haciaServicios = page.locator('main a[href^="/servicios/#"]');
    test.skip((await haciaServicios.count()) === 0, 'Ese proyecto no tiene servicios enlazados');

    const href = await haciaServicios.first().getAttribute('href');
    const ancla = href!.split('#')[1];
    await page.goto('/servicios/');
    // El ancla debe existir, o el enlace lleva a media página.
    await expect(page.locator(`#${ancla}`)).toHaveCount(1);
  });

  test('sin servicios enlazados no se pinta la sección vacía', async ({ page }) => {
    const rutas = await rutasDeProyectos(page);
    test.skip(rutas.length === 0, 'No hay proyectos publicados');

    for (const ruta of rutas) {
      await page.goto(ruta);
      const encabezado = page.getByText('Servicios que intervinieron', { exact: true });
      if ((await encabezado.count()) > 0) {
        // Si el encabezado está, debe haber al menos un enlace debajo.
        expect(await page.locator('main a[href^="/servicios/#"]').count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('404 y gracias', () => {
  test('el 404 ofrece cotizar, servicios y portafolio', async ({ page }) => {
    await page.goto('/esta-ruta-no-existe/');
    await expect(page.locator('main a[href="/contacto/"]')).toHaveCount(1);
    await expect(page.locator('main a[href="/servicios/"]')).toHaveCount(1);
    await expect(page.locator('main a[href="/portafolio/"]')).toHaveCount(1);
  });

  test('/gracias es noindex y ofrece WhatsApp y portafolio', async ({ page }) => {
    const respuesta = await page.goto('/gracias/');
    expect(respuesta?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('main a[href^="https://wa.me/"]')).toHaveCount(1);
    await expect(page.locator('main a[href="/portafolio/"]')).toHaveCount(1);
  });

  test('/gracias no aparece en el sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap-0.xml')).text();
    expect(xml).not.toContain('/gracias');
  });
});
