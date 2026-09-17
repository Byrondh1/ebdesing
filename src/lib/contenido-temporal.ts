/**
 * CONTENIDO TEMPORAL — se elimina en los pasos 6-7 del BUILD ORDER.
 *
 * La regla del proyecto es que servicios, proyectos y testimonios viven en Sanity,
 * nunca hardcodeados en componentes .astro. Este módulo respeta esa regla: los
 * componentes reciben los datos por props y no saben de dónde vienen. Cuando
 * exista el proyecto de Sanity, se sustituye la importación por un fetch en
 * `src/lib/sanity.ts` y los componentes no cambian.
 *
 * Los tipos replican los schemas de §4 del blueprint a propósito, para que el
 * cambio sea sin fricción.
 */

export interface ConfiguracionSitio {
  telefonoWhatsapp: string;
  emailContacto: string;
  direccion: string;
  redesSociales: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
}

export interface Servicio {
  titulo: string;
  slug: string;
  icono: string;
  descripcionCorta: string;
  descripcionCompleta: string;
  orden: number;
}

export interface Proyecto {
  titulo: string;
  slug: string;
  cliente: string;
  categoria: 'diseño' | 'publicidad' | 'branding';
  descripcion: string;
  resultado: string;
  destacado: boolean;
  orden: number;
}

export interface Testimonio {
  nombreCliente: string;
  empresa: string;
  cita: string;
}

/** TODO(Byron): confirmar teléfono, email y dirección reales antes del deploy. */
export const configuracionSitio: ConfiguracionSitio = {
  telefonoWhatsapp: '593000000000',
  emailContacto: 'contacto@ebdesing.com',
  direccion: 'Ecuador',
  redesSociales: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/',
  },
};

export const servicios: Servicio[] = [
  {
    titulo: 'Identidad de marca',
    slug: 'identidad-de-marca',
    icono: 'marca',
    descripcionCorta:
      'Logo, paleta, tipografías y las reglas para usarlos. Todo en un manual que tu equipo puede seguir sin preguntarnos.',
    descripcionCompleta:
      'Partimos de lo que ya tienes y de a quién le vendes. Definimos logo, colores, tipografías y el tono con el que hablas, y lo entregamos en un manual corto: qué usar, qué no, y en qué formato. Incluye los archivos listos para imprenta y para redes.',
    orden: 1,
  },
  {
    titulo: 'Diseño publicitario',
    slug: 'diseno-publicitario',
    icono: 'anuncio',
    descripcionCorta:
      'Piezas para redes, vallas, volantes y punto de venta. Adaptadas a cada formato, no estiradas.',
    descripcionCompleta:
      'Cada canal tiene su medida y su tiempo de lectura. Diseñamos la pieza pensando en dónde se va a ver: un feed de Instagram no es una valla ni un volante. Entregamos cada formato por separado, en la resolución que pide el medio.',
    orden: 2,
  },
  {
    titulo: 'Gran formato e impresión',
    slug: 'gran-formato',
    icono: 'impresion',
    descripcionCorta:
      'Rótulos, lonas, vehículos y señalética. Archivos listos para imprenta, sin sorpresas de color.',
    descripcionCompleta:
      'Preparamos artes para gran formato con las sangrías, perfiles de color y resoluciones que pide cada material. Coordinamos con la imprenta para que lo que apruebas en pantalla sea lo que sale montado.',
    orden: 3,
  },
  {
    titulo: 'Contenido para redes',
    slug: 'contenido-redes',
    icono: 'redes',
    descripcionCorta:
      'Parrillas mensuales con piezas listas para publicar y los textos que las acompañan.',
    descripcionCompleta:
      'Armamos la parrilla del mes, diseñamos cada pieza y escribimos el copy. Tú apruebas una vez y publicas todo el mes sin estar pidiendo artes a última hora.',
    orden: 4,
  },
];

export const proyectos: Proyecto[] = [
  {
    titulo: 'Rebranding completo',
    slug: 'rebranding-completo',
    cliente: 'Cliente de ejemplo',
    categoria: 'branding',
    descripcion:
      'Rediseño de identidad para una empresa con quince años en el mercado y un logo que ya no la representaba.',
    resultado: 'Manual de marca entregado y aplicado en local, vehículos y redes.',
    destacado: true,
    orden: 1,
  },
  {
    titulo: 'Campaña de temporada',
    slug: 'campana-temporada',
    cliente: 'Cliente de ejemplo',
    categoria: 'publicidad',
    descripcion:
      'Campaña de seis semanas para redes y punto de venta, con piezas adaptadas a cada formato.',
    resultado: 'Piezas publicadas en tres canales durante toda la temporada.',
    destacado: true,
    orden: 2,
  },
  {
    titulo: 'Señalética y rotulación',
    slug: 'senaletica-rotulacion',
    cliente: 'Cliente de ejemplo',
    categoria: 'diseño',
    descripcion:
      'Sistema de señalización interna y rótulo exterior para un local de dos plantas.',
    resultado: 'Instalación completa, del rótulo a la señalización de cada área.',
    destacado: true,
    orden: 3,
  },
];

export const testimonios: Testimonio[] = [
  {
    nombreCliente: 'Nombre del cliente',
    empresa: 'Empresa de ejemplo',
    cita: 'Entendieron lo que queríamos a la primera y lo entregaron cuando dijeron que lo iban a entregar.',
  },
  {
    nombreCliente: 'Nombre del cliente',
    empresa: 'Empresa de ejemplo',
    cita: 'Nos resolvieron el rótulo y las piezas de redes con la misma línea. Por fin todo se ve de la misma marca.',
  },
];

/** Los proyectos que aparecen en la Home. */
export const proyectosDestacados = proyectos
  .filter((p) => p.destacado)
  .sort((a, b) => a.orden - b.orden);

export const serviciosOrdenados = [...servicios].sort((a, b) => a.orden - b.orden);

/** Link de WhatsApp con mensaje prellenado — §5 del blueprint, cero backend. */
export function enlaceWhatsapp(mensaje = 'Hola, quiero cotizar un proyecto.'): string {
  return `https://wa.me/${configuracionSitio.telefonoWhatsapp}?text=${encodeURIComponent(mensaje)}`;
}
