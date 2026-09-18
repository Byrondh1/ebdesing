import type { ConfiguracionSitio, Servicio } from './tipos';

export const NOMBRE_MARCA = 'EBDesing';
export const NOMBRE_COMERCIAL = '3B Designs';

/**
 * Teléfono de ejemplo. Mientras el dato sea este, el JSON-LD lo omite en vez de
 * publicar un número falso como dato estructurado.
 */
export const TELEFONO_MARCADOR = '593000000000';

/** Convierte una ruta relativa en absoluta contra el dominio del sitio. */
export function absoluta(ruta: string, sitio: URL | undefined): string {
  if (!sitio) throw new Error('Falta `site` en astro.config.mjs: sin él no hay URLs absolutas.');
  return new URL(ruta, sitio).href;
}

/**
 * Un dato estructurado falso es peor que uno ausente: le afirma a Google algo
 * incorrecto y verificable sobre el negocio. Estas dos guardas omiten los datos
 * de ejemplo; al poner los reales aparecen solos.
 */
const esPerfilReal = (url: string) => {
  try {
    return new URL(url).pathname.replace(/\/$/, '').length > 0;
  } catch {
    return false;
  }
};

const esTelefonoReal = (telefono: string) => Boolean(telefono) && telefono !== TELEFONO_MARCADOR;

/**
 * Organización: la entidad que Google asocia al dominio. Va en todas las páginas.
 * TODO(Byron): `logo` apunta al favicon. Para rich results conviene un PNG del logo
 * de al menos 112x112 — reemplazar cuando exista el archivo de marca.
 */
/**
 * ¿Hay local físico de verdad? Con calle y ciudad, sí: lo demás son datos sueltos
 * que no bastan para publicarse como negocio local.
 */
export const tieneLocal = (config: ConfiguracionSitio) =>
  Boolean(config.local?.calle && config.local?.ciudad);

/**
 * La entidad del negocio. Va en todas las páginas.
 *
 * Con local físico se publica como `LocalBusiness`, que es un SUBTIPO de
 * Organization: se cambia el @type pero se mantiene el mismo @id. Emitir las dos por
 * separado crearía dos entidades compitiendo por el mismo negocio, que es peor que
 * tener solo una.
 *
 * TODO(Byron): `logo` apunta al favicon. Para rich results conviene un PNG del logo
 * de al menos 112x112 — reemplazar cuando exista el archivo de marca.
 */
export function organizacion(sitio: URL | undefined, config: ConfiguracionSitio) {
  const { emailContacto, telefonoWhatsapp, direccion, redesSociales, local } = config;
  const redes = (Object.values(redesSociales ?? {}).filter(Boolean) as string[]).filter(esPerfilReal);
  const conLocal = tieneLocal(config);

  return {
    '@context': 'https://schema.org',
    '@type': conLocal ? 'LocalBusiness' : 'Organization',
    '@id': absoluta('/#organizacion', sitio),
    name: NOMBRE_MARCA,
    alternateName: NOMBRE_COMERCIAL,
    url: absoluta('/', sitio),
    logo: absoluta('/favicon.svg', sitio),
    description:
      'Agencia de diseño y publicidad en Ecuador: identidad de marca, campañas, gran formato y contenido para redes.',
    ...(emailContacto && { email: emailContacto }),
    ...(esTelefonoReal(telefonoWhatsapp) && { telephone: `+${telefonoWhatsapp}` }),
    address: conLocal
      ? {
          '@type': 'PostalAddress',
          addressCountry: 'EC',
          streetAddress: local!.calle,
          addressLocality: local!.ciudad,
          ...(local!.provincia && { addressRegion: local!.provincia }),
          ...(local!.codigoPostal && { postalCode: local!.codigoPostal }),
        }
      : {
          '@type': 'PostalAddress',
          addressCountry: 'EC',
          ...(direccion && { addressLocality: direccion }),
        },
    areaServed: { '@type': 'Country', name: 'Ecuador' },
    ...(conLocal && local!.enlaceMapa && { hasMap: local!.enlaceMapa }),
    ...(redes.length > 0 && { sameAs: redes }),
  };
}

/** Sitio web. Enlaza al publisher para que Google no trate ambas entidades por separado. */
export function sitioWeb(sitio: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluta('/#sitio', sitio),
    url: absoluta('/', sitio),
    name: NOMBRE_MARCA,
    inLanguage: 'es-EC',
    publisher: { '@id': absoluta('/#organizacion', sitio) },
  };
}

/** Un `Service` por servicio ofrecido, envueltos en una lista ordenada. */
export function listaDeServicios(servicios: Servicio[], sitio: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Servicios de EBDesing',
    itemListElement: servicios.map((servicio, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: servicio.titulo,
        description: servicio.descripcionCorta,
        serviceType: servicio.titulo,
        provider: { '@id': absoluta('/#organizacion', sitio) },
        areaServed: { '@type': 'Country', name: 'Ecuador' },
      },
    })),
  };
}

/** Ficha de un proyecto del portafolio, para su página de detalle. */
export function obraCreativa(
  proyecto: { titulo: string; slug: string; descripcion: string; cliente: string; imagenPrincipal?: { url: string } },
  sitio: URL | undefined
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: proyecto.titulo,
    description: proyecto.descripcion,
    url: absoluta(`/portafolio/${proyecto.slug}/`, sitio),
    creator: { '@id': absoluta('/#organizacion', sitio) },
    ...(proyecto.imagenPrincipal?.url && { image: proyecto.imagenPrincipal.url }),
    ...(proyecto.cliente && { about: proyecto.cliente }),
  };
}

/** Migas de pan. `ruta` no incluye el inicio; esta función lo antepone. */
export function migas(
  ruta: Array<{ nombre: string; href: string }>,
  sitio: URL | undefined
) {
  const completa = [{ nombre: 'Inicio', href: '/' }, ...ruta];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: completa.map((paso, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: paso.nombre,
      item: absoluta(paso.href, sitio),
    })),
  };
}

/**
 * Preguntas frecuentes en formato FAQPage.
 *
 * Google puede mostrar estas respuestas directamente en los resultados, así que el
 * texto del schema debe ser EXACTAMENTE el que se ve en la página: marcar una
 * respuesta que el visitante no encuentra al llegar es motivo de penalización.
 */
export function preguntasFrecuentes(
  preguntas: Array<{ pregunta: string; respuesta: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: preguntas.map((p) => ({
      '@type': 'Question',
      name: p.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
    })),
  };
}
