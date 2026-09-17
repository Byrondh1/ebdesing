/**
 * Punto de entrada ÚNICO del contenido.
 *
 * Las páginas importan de aquí, nunca de `sanity.ts` ni de `contenido-temporal.ts`.
 * Así el origen de los datos se decide en un solo sitio.
 */
import { leerEnv } from './env';
import type {
  ConfiguracionSitio,
  Proyecto,
  Servicio,
  Testimonio,
} from './tipos';

/**
 * Respaldo local para trabajar sin red (o donde sanity.io esté bloqueado).
 *
 * Es OPT-IN a propósito: por defecto el build falla si no puede hablar con Sanity,
 * que es lo correcto — mejor un deploy roto que uno que publica en silencio un
 * portafolio vacío o de mentira.
 *
 * Además se niega a activarse en Cloudflare Pages, que define CF_PAGES. Si alguien
 * deja la variable puesta en el panel por error, el build falla en vez de publicar
 * contenido de ejemplo con el dominio real.
 */
function usarContenidoLocal(): boolean {
  const pedido = leerEnv('USAR_CONTENIDO_LOCAL') === '1';
  if (!pedido) return false;

  if (leerEnv('CF_PAGES')) {
    throw new Error(
      'USAR_CONTENIDO_LOCAL=1 está activo en un build de Cloudflare Pages. Eso publicaría ' +
        'contenido de ejemplo en producción. Quita la variable del panel de Cloudflare.'
    );
  }

  console.warn(
    '\n  ⚠  USAR_CONTENIDO_LOCAL=1 — contenido de ejemplo, NO de Sanity.\n' +
      '     Solo para desarrollo sin red. El resultado no sirve para publicar.\n'
  );
  return true;
}

const LOCAL = usarContenidoLocal();

/**
 * Cada página pide la configuración y las listas, así que sin memoizar haríamos la
 * misma consulta siete veces por build. Se cachea la promesa, no el resultado, para
 * que las llamadas concurrentes compartan una sola petición.
 */
function unaVez<T>(fn: () => Promise<T>): () => Promise<T> {
  let pendiente: Promise<T> | undefined;
  return () => (pendiente ??= fn());
}

const _obtenerServicios = async (): Promise<Servicio[]> => {
  if (LOCAL) return (await import('./contenido-temporal')).servicios;
  return (await import('./sanity')).obtenerServicios();
};

const _obtenerProyectos = async (): Promise<Proyecto[]> => {
  if (LOCAL) return (await import('./contenido-temporal')).proyectos;
  return (await import('./sanity')).obtenerProyectos();
};

export async function obtenerProyecto(slug: string): Promise<Proyecto | null> {
  if (LOCAL) {
    const { proyectos } = await import('./contenido-temporal');
    return proyectos.find((p) => p.slug === slug) ?? null;
  }
  return (await import('./sanity')).obtenerProyecto(slug);
}

const _obtenerTestimonios = async (): Promise<Testimonio[]> => {
  if (LOCAL) return (await import('./contenido-temporal')).testimonios;
  return (await import('./sanity')).obtenerTestimonios();
};

const _obtenerConfiguracion = async (): Promise<ConfiguracionSitio> => {
  if (LOCAL) return (await import('./contenido-temporal')).configuracionSitio;

  const config = await (await import('./sanity')).obtenerConfiguracion();
  if (!config) {
    throw new Error(
      'No hay documento `configuracionSitio` en Sanity. Créalo en el Studio: sin él no hay ' +
        'teléfono de WhatsApp, correo ni redes, y el sitio saldría con los enlaces rotos.'
    );
  }
  return config;
};

export const obtenerServicios = unaVez(_obtenerServicios);
export const obtenerProyectos = unaVez(_obtenerProyectos);
export const obtenerTestimonios = unaVez(_obtenerTestimonios);
export const obtenerConfiguracion = unaVez(_obtenerConfiguracion);

export async function obtenerProyectosDestacados(): Promise<Proyecto[]> {
  return (await obtenerProyectos()).filter((p) => p.destacado);
}

/** Link de WhatsApp con mensaje prellenado — §5 del blueprint, cero backend. */
export function enlaceWhatsapp(
  telefono: string,
  mensaje = 'Hola, quiero cotizar un proyecto.'
): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

export { recortar } from './imagenes';
