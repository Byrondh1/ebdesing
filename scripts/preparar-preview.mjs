/**
 * Copia .dev.vars a dist/server/ antes de `astro preview`.
 *
 * `astro dev` lee .dev.vars de la raíz del proyecto, pero `astro preview` levanta
 * wrangler, que lo busca junto a su config generada en dist/server/. Como dist/ se
 * rehace en cada build, sin esto el endpoint de cotización responde 502 en preview
 * aunque funcione en dev.
 *
 * No falla si no hay .dev.vars: no todo el mundo necesita probar el formulario.
 */
import { copyFile, access, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, '.dev.vars');
const destino = join(raiz, 'dist', 'server', '.dev.vars');

const existe = (p) => access(p).then(() => true, () => false);

if (!(await existe(origen))) {
  console.log('preview: sin .dev.vars — el endpoint de cotización responderá 502.');
} else if (!(await existe(join(raiz, 'dist', 'server')))) {
  console.log('preview: no hay dist/server — corre `npm run build` primero.');
} else {
  await mkdir(dirname(destino), { recursive: true });
  await copyFile(origen, destino);
  console.log('preview: .dev.vars copiado a dist/server/');
}
