/**
 * Envoltorio para que Playwright pueda gobernar el servidor de preview.
 *
 * `astro preview` se demoniza: devuelve el control en cuanto arranca y el servidor
 * queda de fondo. El `webServer` de Playwright espera un proceso en primer plano que
 * pueda matar al terminar. Sin esto pasan dos cosas malas:
 *   1. Playwright aborta con "Process from config.webServer exited early".
 *   2. El servidor queda vivo ocupando el puerto, y la siguiente ejecución no arranca
 *      o —peor— prueba contra un build viejo.
 *
 * Astro deja el PID en .astro/preview.json, así que se mata por PID en vez de gastar
 * un `npx astro preview stop`: eso tarda ~1s y Playwright no siempre espera tanto.
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK = join(raiz, '.astro', 'preview.json');
const URL_SERVIDOR = process.env.URL_PRUEBAS ?? 'http://localhost:4321/';
const ESPERA_MAXIMA_MS = 90_000;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const leerPid = () => {
  if (!existsSync(LOCK)) return null;
  try {
    return JSON.parse(readFileSync(LOCK, 'utf8')).pid ?? null;
  } catch {
    return null;
  }
};

const matar = (pid) => {
  if (!pid) return false;
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false; // ya no existe
  }
};

// El envoltorio llama a `astro preview` directamente, así que el hook `prepreview` de
// npm NO se dispara. Sin esto, .dev.vars no llega a dist/server/ y el endpoint de
// cotización responde 502 durante las pruebas: la prueba del envío correcto se salta
// en silencio y parece que todo está bien.
await import('./preparar-preview.mjs');

// Restos de una ejecución anterior: el puerto debe quedar libre antes de empezar.
const pidViejo = leerPid();
if (matar(pidViejo)) {
  console.log(`Se paró un preview anterior (pid ${pidViejo}).`);
  rmSync(LOCK, { force: true });
  await dormir(1000);
}

const arranque = spawn('npx', ['astro', 'preview'], { stdio: 'inherit' });
arranque.on('error', (error) => {
  console.error('No se pudo arrancar el preview:', error.message);
  process.exit(1);
});

const esperarServidor = async () => {
  const limite = Date.now() + ESPERA_MAXIMA_MS;
  while (Date.now() < limite) {
    try {
      if ((await fetch(URL_SERVIDOR)).ok) return true;
    } catch {
      // aún no responde
    }
    await dormir(500);
  }
  return false;
};

if (!(await esperarServidor())) {
  console.error(`El preview no respondió en ${ESPERA_MAXIMA_MS / 1000}s.`);
  matar(leerPid());
  process.exit(1);
}

const pid = leerPid();
console.log(`Servidor de pruebas listo en ${URL_SERVIDOR} (pid ${pid})`);

let parando = false;
const parar = (codigo) => {
  if (parando) return;
  parando = true;
  matar(leerPid());
  rmSync(LOCK, { force: true });
  process.exit(codigo);
};

for (const senal of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(senal, () => parar(0));
process.on('exit', () => {
  if (!parando) {
    matar(leerPid());
    rmSync(LOCK, { force: true });
  }
});

// Mantiene vivo el proceso hasta que Playwright lo mate. Un `await` de una promesa que
// nunca resuelve NO basta: Node avisa de "unsettled top-level await" y se cierra.
setInterval(() => {}, 1 << 30);
