/**
 * Auditoría de metadata sobre el build (§13 del blueprint).
 *
 * Corre como `postbuild`, así que un fallo de SEO rompe `npm run build` en vez de
 * llegar a producción sin que nadie lo note. También se puede correr suelto:
 *   node scripts/auditar-seo.mjs
 */
import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');

const problemas = [];
const falla = (ruta, mensaje) => problemas.push(`${ruta}: ${mensaje}`);

async function listarHtml(dir) {
  const salida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...(await listarHtml(p)));
    else if (entrada.name.endsWith('.html')) salida.push(p);
  }
  return salida;
}

const existe = async (p) => access(p).then(() => true, () => false);
const extraer = (html, re) => html.match(re)?.[1]?.trim();

const archivos = (await listarHtml(dist)).sort();
const titulos = new Map();
const descripciones = new Map();

for (const archivo of archivos) {
  const ruta = '/' + relative(dist, archivo).replace(/index\.html$/, '').replace(/\\/g, '/');
  const html = await readFile(archivo, 'utf8');
  const noindex = /<meta name="robots" content="noindex/.test(html);

  // --- title ---
  const titulo = extraer(html, /<title>([^<]*)<\/title>/);
  if (!titulo) falla(ruta, 'falta <title>');
  else {
    if (titulo.length > 65) falla(ruta, `<title> de ${titulo.length} caracteres (máx. 65)`);
    if (titulos.has(titulo)) falla(ruta, `<title> duplicado con ${titulos.get(titulo)}`);
    titulos.set(titulo, ruta);
  }

  // --- description ---
  const desc = extraer(html, /<meta name="description" content="([^"]*)"/);
  if (!desc) falla(ruta, 'falta meta description');
  else {
    if (desc.length < 50 || desc.length > 165)
      falla(ruta, `description de ${desc.length} caracteres (se espera 50-165)`);
    if (descripciones.has(desc)) falla(ruta, `description duplicada con ${descripciones.get(desc)}`);
    descripciones.set(desc, ruta);
  }

  // --- canonical ---
  const canonical = extraer(html, /<link rel="canonical" href="([^"]*)"/);
  if (!canonical) falla(ruta, 'falta canonical');
  else {
    let url;
    try {
      url = new URL(canonical);
    } catch {
      falla(ruta, `canonical mal formado: ${canonical}`);
    }
    if (url) {
      if (url.protocol !== 'https:') falla(ruta, `canonical no es https: ${canonical}`);
      const esperada = ruta === '/404.html' ? '/404/' : ruta;
      if (url.pathname !== esperada)
        falla(ruta, `canonical apunta a ${url.pathname}, se esperaba ${esperada}`);
    }
  }

  // --- og:image: debe existir el archivo, no solo la etiqueta ---
  const og = extraer(html, /<meta property="og:image" content="([^"]*)"/);
  if (!noindex) {
    if (!og) falla(ruta, 'falta og:image');
    else {
      const local = join(dist, new URL(og).pathname);
      if (!(await existe(local))) falla(ruta, `og:image apunta a un archivo que no existe: ${og}`);
    }
  }

  // --- JSON-LD válido ---
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  if (!noindex && bloques.length === 0) falla(ruta, 'sin JSON-LD');
  for (const [, cuerpo] of bloques) {
    try {
      const dato = JSON.parse(cuerpo);
      if (!dato['@context'] || !dato['@type']) falla(ruta, 'JSON-LD sin @context o @type');
    } catch (e) {
      falla(ruta, `JSON-LD no parsea: ${e.message}`);
    }
  }

  // --- un solo h1 ---
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) falla(ruta, `${h1} elementos h1 (se espera exactamente 1)`);
}

// --- sitemap: debe existir y no listar páginas noindex ---
const sitemap = join(dist, 'sitemap-0.xml');
if (!(await existe(sitemap))) falla('sitemap', 'no se generó sitemap-0.xml');
else {
  const xml = await readFile(sitemap, 'utf8');
  for (const archivo of archivos) {
    const html = await readFile(archivo, 'utf8');
    if (!/<meta name="robots" content="noindex/.test(html)) continue;
    const ruta = '/' + relative(dist, archivo).replace(/index\.html$/, '');
    if (xml.includes(ruta.replace(/\/$/, '') + '/')) falla('sitemap', `incluye la noindex ${ruta}`);
  }
}

// --- robots.txt ---
if (!(await existe(join(dist, 'robots.txt')))) falla('robots.txt', 'no existe');

console.log(`\nAuditoría SEO — ${archivos.length} páginas, ${titulos.size} títulos únicos, ${descripciones.size} descripciones únicas`);
if (problemas.length) {
  console.error(`\n${problemas.length} problema(s):`);
  for (const p of problemas) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log('Sin títulos faltantes, sin descripciones duplicadas, sin canonical mal formados.\n');
