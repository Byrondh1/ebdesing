/**
 * Lista todo lo que sigue siendo un marcador y debe reemplazarse antes del deploy.
 *
 *   node scripts/marcadores-pendientes.mjs
 *
 * Sale con código 1 si queda alguno: úsalo como puerta antes de publicar.
 * NO está enganchado al build a propósito — durante el desarrollo los marcadores
 * son legítimos y romper el build por ellos sería ruido.
 */
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFile(join(raiz, p), 'utf8');
const existe = (p) => access(join(raiz, p)).then(() => true, () => false);

const pendientes = [];
const anotar = (area, detalle, donde) => pendientes.push({ area, detalle, donde });

const config = await leer('astro.config.mjs');
const contenido = await leer('src/lib/contenido-temporal.ts');

// --- dominio ---
const sitio = config.match(/const SITIO = '([^']+)'/)?.[1];
if (sitio === 'https://ebdesing.com')
  anotar('Dominio', `sigue en ${sitio} sin confirmar — de él dependen canonical, sitemap y JSON-LD`, 'astro.config.mjs');

// --- datos de contacto ---
const telefono = contenido.match(/telefonoWhatsapp: '([^']+)'/)?.[1];
if (telefono === '593000000000')
  anotar('WhatsApp', `número marcador ${telefono} — el botón de WhatsApp no lleva a ninguna parte`, 'src/lib/contenido-temporal.ts');

const email = contenido.match(/emailContacto: '([^']+)'/)?.[1];
if (email === 'contacto@ebdesing.com')
  anotar('Correo', `${email} sin confirmar — aparece en footer, contacto y JSON-LD`, 'src/lib/contenido-temporal.ts');

const direccion = contenido.match(/direccion: '([^']+)'/)?.[1];
if (direccion === 'Ecuador')
  anotar('Dirección', 'solo dice "Ecuador"; conviene ciudad o dirección real para SEO local', 'src/lib/contenido-temporal.ts');

// --- redes ---
for (const [, red, url] of contenido.matchAll(/(instagram|facebook|tiktok): '([^']+)'/g)) {
  try {
    if (new URL(url).pathname.replace(/\/$/, '') === '')
      anotar('Redes', `${red} apunta a la portada de la plataforma, no a un perfil`, 'src/lib/contenido-temporal.ts');
  } catch {
    anotar('Redes', `${red} tiene una URL inválida: ${url}`, 'src/lib/contenido-temporal.ts');
  }
}

// --- copy y contenido de ejemplo ---
if (/Cliente de ejemplo|Nombre del cliente|Empresa de ejemplo/.test(contenido))
  anotar('Contenido', 'proyectos y testimonios son de ejemplo; se reemplazan con Sanity (pasos 6-7)', 'src/lib/contenido-temporal.ts');

// --- artefactos temporales ---
if (await existe('src/pages/components-preview.astro'))
  anotar('Limpieza', 'la página /components-preview sigue existiendo; bórrala antes del deploy', 'src/pages/components-preview.astro');

if (await existe('src/lib/contenido-temporal.ts'))
  anotar('Sanity', 'el contenido aún sale del módulo temporal, no del CMS', 'src/lib/contenido-temporal.ts');

// --- logo ---
if ((await leer('src/lib/seo.ts')).includes("absoluta('/favicon.svg'"))
  anotar('Logo', 'el JSON-LD usa el favicon como logo; Google prefiere un PNG de 112px o más', 'src/lib/seo.ts');

// --- salida ---
if (pendientes.length === 0) {
  console.log('\nSin marcadores pendientes. Listo para deploy.\n');
  process.exit(0);
}

console.log(`\n${pendientes.length} marcador(es) pendiente(s) antes del deploy:\n`);
let areaPrevia = null;
for (const p of pendientes) {
  if (p.area !== areaPrevia) console.log(`  ${p.area}`);
  areaPrevia = p.area;
  console.log(`    · ${p.detalle}`);
  console.log(`      ${p.donde}`);
}
console.log('');
process.exit(1);
