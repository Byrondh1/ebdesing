import type { Imagen } from './tipos';

/**
 * La CDN de imágenes de Sanity acepta transformaciones por query string, así que no
 * hace falta @sanity/image-url para lo que necesitamos.
 *
 * Vive aparte de `sanity.ts` a propósito: ese módulo lanza si falta la configuración,
 * y esta función debe poder usarse también con el contenido local.
 */
export function recortar(
  imagen: Imagen | undefined,
  ancho: number,
  alto?: number
): string | undefined {
  if (!imagen?.url) return undefined;
  if (!imagen.url.includes('cdn.sanity.io')) return imagen.url;

  const params = new URLSearchParams({ w: String(ancho), fit: 'crop', auto: 'format' });
  if (alto) params.set('h', String(alto));
  return `${imagen.url}?${params}`;
}
