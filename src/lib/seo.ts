import { configuracionSitio, TELEFONO_MARCADOR, type Servicio } from './contenido-temporal';

export const NOMBRE_MARCA = 'EBDesing';
export const NOMBRE_COMERCIAL = '3B Designs';

/** Convierte una ruta relativa en absoluta contra el dominio del sitio. */
export function absoluta(ruta: string, sitio: URL | undefined): string {
  if (!sitio) throw new Error('Falta `site` en astro.config.mjs: sin él no hay URLs absolutas.');
  return new URL(ruta, sitio).href;
}

/**
 * Organización. Va en todas las páginas: es la entidad que Google asocia al dominio.
 * TODO(Byron): `logo` apunta al favicon. Para rich results conviene un PNG del logo
 * de al menos 112x112 — reemplazar cuando exista el archivo de marca.
 */
export function organizacion(sitio: URL | undefined) {
  const { emailContacto, telefonoWhatsapp, direccion, redesSociales } = configuracionSitio;

  // Un dato estructurado falso es peor que uno ausente: le afirma a Google algo
  // incorrecto sobre el negocio. Mientras sean marcadores, se omiten.
  const esPerfilReal = (url: string) => {
    try {
      return new URL(url).pathname.replace(/\/$/, '').length > 0;
    } catch {
      return false;
    }
  };
  const redes = (Object.values(redesSociales).filter(Boolean) as string[]).filter(esPerfilReal);
  const telefonoReal = telefonoWhatsapp !== TELEFONO_MARCADOR;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': absoluta('/#organizacion', sitio),
    name: NOMBRE_MARCA,
    alternateName: NOMBRE_COMERCIAL,
    url: absoluta('/', sitio),
    logo: absoluta('/favicon.svg', sitio),
    description:
      'Agencia de diseño y publicidad en Ecuador: identidad de marca, campañas, gran formato y contenido para redes.',
    email: emailContacto,
    ...(telefonoReal && { telephone: `+${telefonoWhatsapp}` }),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EC',
      addressLocality: direccion,
    },
    areaServed: { '@type': 'Country', name: 'Ecuador' },
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
