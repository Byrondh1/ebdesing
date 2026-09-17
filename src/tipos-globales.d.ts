/**
 * Declaración local de `cloudflare:workers`.
 *
 * Los tipos reales vienen de @cloudflare/workers-types, pero de ese módulo solo
 * usamos `env` (en `src/pages/api/cotizacion.ts`), así que no compensa instalar un
 * paquete de tipos entero para una sola cosa. Si algún día se usa más del runtime de
 * Workers, instala @cloudflare/workers-types y borra este archivo.
 *
 * El valor real lo inyecta el runtime de Cloudflare: en producción trae las variables
 * del panel de Pages, y en local las de .dev.vars.
 */
declare module 'cloudflare:workers' {
  export const env: Record<string, string | undefined>;
}
