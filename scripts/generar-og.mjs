/**
 * Genera las imágenes Open Graph (1200x630), una por página.
 *
 * Los PNG se COMMITEAN en public/og/. Son artefactos, no se generan en cada build:
 * así el deploy en Cloudflare no depende de un navegador headless ni de qué fuentes
 * tenga la máquina que construye.
 *
 * A propósito NO imprimen el dominio: todavía no está confirmado y un PNG con el
 * dominio equivocado es más difícil de detectar que una línea de configuración.
 *
 * Regenerar cuando cambien los títulos de scripts/og.config.mjs o los colores de marca:
 *   npx playwright install chromium   # solo la primera vez
 *   node scripts/generar-og.mjs
 */
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { paginasOg } from './og.config.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const salida = join(raiz, 'public', 'og');

const ORO = '#F5B800';
const NEGRO = '#0A0A0A';

// Las fuentes se incrustan en base64: así el render no depende de las fuentes del sistema
// y la imagen sale idéntica en cualquier máquina.
const aBase64 = async (ruta) => (await readFile(join(raiz, ruta))).toString('base64');

const plantilla = (pagina, archivoDisplay, archivoBody) => `
<!doctype html>
<html>
<head><meta charset="utf-8" />
<style>
  @font-face { font-family: 'Display'; src: url(data:font/woff2;base64,${archivoDisplay}) format('woff2'); }
  @font-face { font-family: 'Body'; src: url(data:font/woff2;base64,${archivoBody}) format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: ${NEGRO}; color: #fff;
         font-family: 'Body', sans-serif; display: flex; flex-direction: column;
         justify-content: space-between; padding: 72px; }
  .etiqueta { font-family: 'Display'; font-size: 22px; letter-spacing: 0.3em;
              text-transform: uppercase; color: ${ORO}; }
  h1 { font-family: 'Display'; font-size: 76px; line-height: 1.08; max-width: 950px; }
  .barra { width: 120px; height: 10px; background: ${ORO}; margin-bottom: 28px; }
  footer { display: flex; align-items: center; justify-content: space-between; }
  .marca { font-family: 'Display'; font-size: 30px; }
  .marca span { color: ${ORO}; }
  .dominio { font-size: 22px; color: #9a9a9a; }
</style></head>
<body>
  <div><div class="barra"></div><p class="etiqueta">${pagina.etiqueta}</p></div>
  <h1>${pagina.titulo}</h1>
  <footer>
    <p class="marca">3B<span>Designs</span></p>
    <p class="dominio">Agencia de Diseño y Publicidad</p>
  </footer>
</body></html>`;

const display = await aBase64('public/fonts/archivo-black-400.woff2');
const body = await aBase64('public/fonts/inter-variable.woff2');

await mkdir(salida, { recursive: true });
const navegador = await chromium.launch();
const pagina = await (await navegador.newContext({ viewport: { width: 1200, height: 630 } })).newPage();

for (const entrada of paginasOg) {
  await pagina.setContent(plantilla(entrada, display, body), { waitUntil: 'load' });
  await pagina.evaluate(() => document.fonts.ready);
  const buffer = await pagina.screenshot({ type: 'png' });
  await writeFile(join(salida, `${entrada.archivo}.png`), buffer);
  console.log(`  public/og/${entrada.archivo}.png  ${(buffer.length / 1024).toFixed(0)}KB`);
}

await navegador.close();
console.log(`\n${paginasOg.length} imágenes OG generadas.`);
