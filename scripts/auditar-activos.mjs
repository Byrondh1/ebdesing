/**
 * Comprueba el peso de los activos que servimos nosotros (paso 11 del BUILD ORDER:
 * "ninguna imagen enviada supera 200KB").
 *
 * Corre como parte de postbuild, así que una imagen pesada rompe el build en vez de
 * llegar a producción. Las imágenes de Sanity no pasan por aquí: viven en su CDN y
 * se piden con `w` y `q` acotados desde `src/lib/imagenes.ts`.
 */
import { readdir, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { directorioDeSalida } from './salida-build.mjs';

const dist = directorioDeSalida();

const LIMITE_IMAGEN = 200 * 1024;
const LIMITE_FUENTE = 100 * 1024;

const IMAGENES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);
const FUENTES = new Set(['.woff2', '.woff', '.ttf', '.otf']);

async function listar(dir) {
  const salida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...(await listar(p)));
    else salida.push(p);
  }
  return salida;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)}KB`;

const problemas = [];
const activos = [];

for (const archivo of await listar(dist)) {
  const ext = extname(archivo).toLowerCase();
  const esImagen = IMAGENES.has(ext);
  const esFuente = FUENTES.has(ext);
  if (!esImagen && !esFuente) continue;

  const { size } = await stat(archivo);
  const ruta = '/' + relative(dist, archivo).replace(/\\/g, '/');
  const limite = esImagen ? LIMITE_IMAGEN : LIMITE_FUENTE;

  activos.push({ ruta, size, tipo: esImagen ? 'imagen' : 'fuente' });
  if (size > limite) {
    problemas.push(`${ruta}: ${kb(size)} supera el límite de ${kb(limite)} para ${esImagen ? 'imágenes' : 'fuentes'}`);
  }
}

activos.sort((a, b) => b.size - a.size);
const total = activos.reduce((suma, a) => suma + a.size, 0);

console.log(`\nActivos propios — ${activos.length} archivos, ${kb(total)} en total`);
for (const a of activos.slice(0, 8)) {
  console.log(`  ${kb(a.size).padStart(6)}  ${a.tipo.padEnd(7)} ${a.ruta}`);
}
if (activos.length > 8) console.log(`  … y ${activos.length - 8} más`);

if (problemas.length) {
  console.error(`\n${problemas.length} activo(s) por encima del límite:`);
  for (const p of problemas) console.error('  ✗ ' + p);
  process.exit(1);
}
console.log(`Ninguno supera su límite (${kb(LIMITE_IMAGEN)} imágenes, ${kb(LIMITE_FUENTE)} fuentes).\n`);
