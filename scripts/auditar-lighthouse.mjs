/**
 * Auditoría Lighthouse (paso 13 del BUILD ORDER).
 *
 *   npm run lighthouse                  # contra localhost:4321 (levántalo antes)
 *   URL_BASE=https://... npm run lighthouse
 *
 * Los umbrales NO son iguales para todo:
 *
 * - SEO y accesibilidad se exigen en firme (>=95). Son propiedades del HTML: dan lo
 *   mismo aquí que en producción, así que un fallo es un fallo de verdad.
 * - Rendimiento se informa pero NO bloquea cuando se mide contra localhost. Sin la
 *   red real ni el CDN de Cloudflare el número no representa lo que verá un visitante,
 *   y bloquear por él invita a "optimizar" contra un entorno ficticio. Al medir contra
 *   el dominio de producción (URL_BASE), sí bloquea.
 */
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const URL_BASE = process.env.URL_BASE ?? 'http://localhost:4321';
const ES_LOCAL = /localhost|127\.0\.0\.1/.test(URL_BASE);

const UMBRALES = {
  seo: 95,
  accessibility: 95,
  performance: 95,
  'best-practices': 90,
};

// Qué categoría bloquea el build según dónde se mida.
const BLOQUEAN = ES_LOCAL
  ? ['seo', 'accessibility', 'best-practices']
  : ['seo', 'accessibility', 'best-practices', 'performance'];

const NOMBRES = {
  performance: 'Rendimiento',
  accessibility: 'Accesibilidad',
  'best-practices': 'Buenas prácticas',
  seo: 'SEO',
};

/** Rutas a auditar. El blueprint pide Home y una página de portafolio. */
async function rutasAAuditar() {
  const rutas = ['/', '/portafolio/'];
  try {
    const html = await (await fetch(`${URL_BASE}/portafolio/`)).text();
    const detalle = [...html.matchAll(/href="(\/portafolio\/[^"/]+\/)"/g)].map((m) => m[1]);
    if (detalle.length > 0) rutas.push(detalle[0]);
  } catch {
    // sin portafolio accesible, se auditan solo las dos fijas
  }
  return rutas;
}

const chrome = await launch({
  chromePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

const problemas = [];
const informes = [];

try {
  for (const ruta of await rutasAAuditar()) {
    const { lhr } = await lighthouse(
      `${URL_BASE}${ruta}`,
      { port: chrome.port, output: 'json', logLevel: 'error' },
      // Perfil móvil con throttling, que es como Google mide.
      { extends: 'lighthouse:default', settings: { formFactor: 'mobile', screenEmulation: { mobile: true, width: 360, height: 780, deviceScaleFactor: 2, disabled: false } } }
    );

    const puntos = Object.fromEntries(
      Object.entries(lhr.categories).map(([clave, cat]) => [clave, Math.round((cat.score ?? 0) * 100)])
    );
    informes.push({ ruta, puntos, lhr });

    for (const [clave, minimo] of Object.entries(UMBRALES)) {
      if (puntos[clave] < minimo && BLOQUEAN.includes(clave)) {
        problemas.push({ ruta, clave, obtenido: puntos[clave], minimo, lhr });
      }
    }
  }
} finally {
  await chrome.kill();
}

// --- informe ---
console.log(`\nLighthouse — perfil móvil, ${URL_BASE}\n`);
const cabecera = ['Ruta', ...Object.keys(UMBRALES).map((k) => NOMBRES[k])];
console.log(`  ${cabecera[0].padEnd(34)}${cabecera.slice(1).map((c) => c.padEnd(18)).join('')}`);
for (const { ruta, puntos } of informes) {
  const celdas = Object.keys(UMBRALES).map((clave) => {
    const valor = puntos[clave];
    const marca = valor >= UMBRALES[clave] ? 'OK' : BLOQUEAN.includes(clave) ? 'FALLA' : 'bajo';
    return `${valor} ${marca}`.padEnd(18);
  });
  console.log(`  ${ruta.padEnd(34)}${celdas.join('')}`);
}

if (ES_LOCAL) {
  console.log(
    '\n  Nota: medido contra localhost, sin red real ni CDN. El rendimiento es orientativo\n' +
      '  y no bloquea; SEO, accesibilidad y buenas prácticas sí.'
  );
}

// --- detalle de lo que falla ---
if (problemas.length > 0) {
  console.error(`\n${problemas.length} categoría(s) por debajo del umbral:\n`);
  for (const { ruta, clave, obtenido, minimo, lhr } of problemas) {
    console.error(`  ✗ ${ruta} · ${NOMBRES[clave]}: ${obtenido} (mínimo ${minimo})`);
    const fallidas = lhr.categories[clave].auditRefs
      .map((ref) => lhr.audits[ref.id])
      .filter((a) => a && a.score !== null && a.score < 1);
    for (const auditoria of fallidas) {
      console.error(`      - ${auditoria.id}: ${auditoria.title}`);
    }
  }
  console.error('');
  process.exit(1);
}

console.log('\nTodas las categorías bloqueantes por encima del umbral.\n');
