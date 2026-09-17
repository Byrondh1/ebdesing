/**
 * Variables de entorno disponibles DURANTE el build.
 *
 * Cada una se lee con un acceso ESTÁTICO a `import.meta.env`, no indexando con una
 * variable. Vite sustituye estos accesos por literales en tiempo de compilación; un
 * acceso dinámico no lo sustituye y devuelve undefined dentro del sandbox de
 * Cloudflare, donde tampoco hay `process.env`.
 *
 * Para añadir una variable: métela aquí Y en VARIABLES_DE_BUILD de astro.config.mjs.
 * Los secretos de runtime (RESEND_API_KEY, CONTACT_EMAIL) NO van aquí: se leen en el
 * endpoint desde `locals.runtime.env`.
 */
const VALORES: Record<string, string | undefined> = {
  SANITY_PROJECT_ID: import.meta.env.SANITY_PROJECT_ID,
  SANITY_DATASET: import.meta.env.SANITY_DATASET,
  SANITY_API_VERSION: import.meta.env.SANITY_API_VERSION,
  USAR_CONTENIDO_LOCAL: import.meta.env.USAR_CONTENIDO_LOCAL,
  CF_PAGES: import.meta.env.CF_PAGES,
};

export function leerEnv(nombre: string): string | undefined {
  const valor = VALORES[nombre];
  return valor !== undefined && valor !== '' ? valor : undefined;
}
