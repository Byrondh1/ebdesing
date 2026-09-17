import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Deja escrito DÓNDE escribió Astro el build, para que las auditorías no tengan que
 * adivinarlo.
 *
 * Antes lo olfateaban: "si existe dist/client, usa ese; si no, dist". Es una heurística,
 * y una heurística puede equivocarse — con salida partida y un script que espera salida
 * plana, la auditoría inventa rutas con prefijo /client/ y dice que no hay sitemap ni
 * robots.txt. Aquí no se adivina: `astro:build:done` entrega el directorio real.
 *
 * El archivo va a .astro/, que está en .gitignore: es un artefacto del build.
 */
export default function registrarSalida() {
  let raiz;

  return {
    name: 'registrar-salida',
    hooks: {
      'astro:config:done': ({ config }) => {
        raiz = fileURLToPath(config.root);
      },
      'astro:build:done': async ({ dir, logger }) => {
        const directorio = fileURLToPath(dir);
        const destino = join(raiz, '.astro', 'salida-build.json');
        await mkdir(dirname(destino), { recursive: true });
        await writeFile(
          destino,
          JSON.stringify({ directorio, generado: new Date().toISOString() }, null, 2) + '\n'
        );
        logger.info(`salida del build registrada: ${directorio}`);
      },
    },
  };
}
