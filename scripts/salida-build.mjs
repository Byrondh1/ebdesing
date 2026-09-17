import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const raizProyecto = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Devuelve el directorio donde Astro dejó el build.
 *
 * Fuente preferida: .astro/salida-build.json, que escribe la integración
 * `registrar-salida` con el directorio REAL que reporta `astro:build:done`.
 *
 * Si no está (por ejemplo, alguien audita un dist/ traído de otro sitio), cae a la
 * heurística de siempre pero AVISANDO, porque es justo la que puede equivocarse: con
 * la salida partida en client/ y server/ y un script que espera salida plana, la
 * auditoría inventa rutas con prefijo /client/ y da por ausentes el sitemap y el
 * robots.txt. Si ves ese aviso junto a errores así, el build no coincide con el script.
 */
export function directorioDeSalida() {
  const registro = join(raizProyecto, '.astro', 'salida-build.json');

  if (existsSync(registro)) {
    try {
      const { directorio } = JSON.parse(readFileSync(registro, 'utf8'));
      if (directorio && existsSync(directorio)) return directorio;
    } catch {
      // registro ilegible: se cae a la heurística
    }
  }

  const conAdaptador = join(raizProyecto, 'dist', 'client');
  const elegido = existsSync(conAdaptador) ? conAdaptador : join(raizProyecto, 'dist');

  console.warn(
    `\n  ⚠  Sin .astro/salida-build.json: el directorio del build se está adivinando (${elegido}).\n` +
      '     Corre `npm run build` para regenerarlo. Si ves errores de rutas con prefijo /client/\n' +
      '     o "no se generó sitemap", la causa es esta adivinanza, no el sitio.\n'
  );
  return elegido;
}
