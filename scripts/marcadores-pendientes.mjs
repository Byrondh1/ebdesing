/**
 * Lista lo que sigue pendiente antes del deploy.
 *
 *   node scripts/marcadores-pendientes.mjs
 *
 * Sale con código 1 si queda algo. NO está enganchado al build a propósito: durante
 * el desarrollo los marcadores son legítimos y romper el build por ellos sería ruido.
 *
 * Solo revisa lo que vive en el código. Los datos de contacto ahora están en Sanity,
 * así que esos se comprueban en el Studio, no aquí — se listan como recordatorio.
 */
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFile(join(raiz, p), 'utf8');
const existe = (p) => access(join(raiz, p)).then(() => true, () => false);

const bloqueantes = [];
const recordatorios = [];

const config = await leer('astro.config.mjs');

// --- dominio ---
const sitio = config.match(/const DOMINIO = '([^']+)'/)?.[1];
// Se sigue comprobando: si alguien lo devuelve al marcador, vuelve a ser bloqueante.
if (!sitio || sitio === 'https://ebdesing.com')
  bloqueantes.push([
    'Dominio sin confirmar',
    `${sitio ?? 'ilegible'} — de él dependen canonical, sitemap, robots.txt, llms.txt y JSON-LD`,
    'astro.config.mjs',
  ]);

// --- página de desarrollo ---
if (await existe('src/pages/components-preview.astro'))
  bloqueantes.push([
    'Página de desarrollo publicada',
    '/components-preview sigue existiendo y se construye con el sitio',
    'bórrala: rm src/pages/components-preview.astro',
  ]);

// --- logo del JSON-LD ---
if ((await leer('src/lib/seo.ts')).includes("absoluta('/favicon.svg'"))
  bloqueantes.push([
    'Logo del JSON-LD',
    'usa el favicon; Google prefiere un PNG de 112px o más para rich results',
    'src/lib/seo.ts',
  ]);

// --- copy escrito por Claude, no por EBDesing ---
recordatorios.push([
  'Copy sin revisar',
  'Hero, CTA y Sobre nosotros los redactó Claude inventando cómo trabaja EBDesing',
  'src/components/sections/Hero.astro, CTA.astro y src/pages/sobre-nosotros.astro',
]);

// --- lo que ahora se comprueba en Sanity ---
recordatorios.push([
  'Documento de configuración',
  'sin `configuracionSitio` publicado en Sanity el build falla: de ahí salen WhatsApp, correo y redes',
  'Studio → Configuración del sitio',
]);
recordatorios.push([
  'Contenido real',
  'servicios, proyectos y testimonios deben existir en Sanity; el sitio se construye vacío si no hay',
  'Studio → Portafolio / Servicios / Testimonios',
]);
recordatorios.push([
  'Colaboradora de EBDesing',
  'falta invitarla para que pueda editar',
  'sanity.io → Project → Members',
]);
recordatorios.push([
  'Webhook de reconstrucción',
  'sin él, publicar en Sanity no actualiza el sitio (§12 del blueprint)',
  'Sanity Settings → API → Webhooks → deploy hook de Cloudflare Pages',
]);

const imprimir = (titulo, lista, marca) => {
  if (lista.length === 0) return;
  console.log(`\n${titulo}\n`);
  for (const [nombre, detalle, donde] of lista) {
    console.log(`  ${marca} ${nombre}`);
    console.log(`     ${detalle}`);
    console.log(`     ${donde}\n`);
  }
};

imprimir(`BLOQUEANTES (${bloqueantes.length}) — arréglalos antes de publicar`, bloqueantes, '✗');
imprimir(`RECORDATORIOS (${recordatorios.length}) — fuera del código`, recordatorios, '·');

if (bloqueantes.length === 0) {
  console.log('Sin bloqueantes en el código.\n');
  process.exit(0);
}
process.exit(1);
