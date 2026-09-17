import type { Imagen } from './tipos';

/**
 * La CDN de imágenes de Sanity acepta transformaciones por query string, así que no
 * hace falta @sanity/image-url para lo que necesitamos.
 *
 * Vive aparte de `sanity.ts` a propósito: ese módulo lanza si falta la configuración,
 * y estas funciones deben poder usarse también con el contenido local.
 */

const ES_DE_SANITY = (url: string) => url.includes('cdn.sanity.io');

/**
 * `auto=format` hace que Sanity sirva AVIF o WebP según lo que acepte el navegador,
 * y caiga a JPEG en los que no. Es lo que cubre el "formatos modernos" del paso 11
 * sin tener que generar y guardar tres versiones de cada imagen.
 *
 * `q=75` es el punto donde el peso baja mucho y la diferencia todavía no se ve en
 * fotografía. Para artes con texto o líneas duras conviene subirlo.
 */
function transformar(url: string, params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams({ auto: 'format', q: '75', fit: 'crop' });
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined) query.set(clave, String(valor));
  }
  return `${url}?${query}`;
}

export function recortar(
  imagen: Imagen | undefined,
  ancho: number,
  alto?: number
): string | undefined {
  if (!imagen?.url) return undefined;
  if (!ES_DE_SANITY(imagen.url)) return imagen.url;
  return transformar(imagen.url, alto ? { w: ancho, h: alto } : { w: ancho });
}

/**
 * srcset para que el navegador pida el tamaño que de verdad va a pintar: en un móvil
 * de 360px no tiene sentido descargar la versión de 1600.
 *
 * Los `alto` se calculan manteniendo la proporción del ancho base, para que todas las
 * variantes recorten igual y no bailen entre resoluciones.
 */
export function conjuntoDeFuentes(
  imagen: Imagen | undefined,
  anchos: number[],
  proporcion?: number
): string | undefined {
  if (!imagen?.url || !ES_DE_SANITY(imagen.url)) return undefined;

  return anchos
    .map((ancho) => {
      const params = proporcion ? { w: ancho, h: Math.round(ancho / proporcion) } : { w: ancho };
      return `${transformar(imagen.url, params)} ${ancho}w`;
    })
    .join(', ');
}
