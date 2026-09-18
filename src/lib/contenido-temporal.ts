/**
 * CONTENIDO DE EJEMPLO — respaldo local para trabajar sin red.
 *
 * NO es el origen de datos del sitio: eso es Sanity (`sanity.ts`). Esto solo se usa
 * cuando USAR_CONTENIDO_LOCAL=1, y `contenido.ts` decide cuándo. Las páginas nunca
 * importan de aquí directamente.
 *
 * Cumple los mismos tipos que Sanity, así que sirve para verificar el build sin red.
 */
import type {
  ConfiguracionSitio,
  MiembroEquipo,
  PreguntaFrecuente,
  Proyecto,
  Servicio,
  Testimonio,
} from './tipos';

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
    reto: 'El logo se había hecho en 2011 y cada quien lo usaba como podía: tres versiones distintas circulando y ningún archivo editable.',
    solucion: 'Partimos de lo que la gente ya reconocía y limpiamos el resto. Un solo logo, una paleta cerrada y un manual de ocho páginas que cualquiera puede seguir.',
    resultado: 'Manual de marca entregado y aplicado en local, vehículos y redes.',
    servicios: [{ titulo: 'Identidad de marca', slug: 'identidad-de-marca' }],
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
    reto: 'Tenían la promoción decidida y dos semanas para salir, sin artes para ninguno de los canales.',
    solucion: 'Una sola idea gráfica bajada a cada formato por separado, en vez de estirar la misma pieza. Entregamos todo antes del arranque.',
    resultado: 'Piezas publicadas en tres canales durante toda la temporada.',
    servicios: [
      { titulo: 'Diseño publicitario', slug: 'diseno-publicitario' },
      { titulo: 'Contenido para redes', slug: 'contenido-redes' },
    ],
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
    reto: 'Los clientes entraban y no sabían a qué planta ir. El personal pasaba el día indicando el camino.',
    solucion: 'Señalización pensada desde la puerta hacia dentro, con el rótulo exterior en la misma línea gráfica.',
    resultado: 'Instalación completa, del rótulo a la señalización de cada área.',
    servicios: [{ titulo: 'Gran formato e impresión', slug: 'gran-formato' }],
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

export const preguntasFrecuentes: PreguntaFrecuente[] = [
  {
    pregunta: '¿Cuánto cuesta un logo?',
    respuesta:
      'Depende de cuánto haya que resolver: no es lo mismo un logo suelto que una identidad completa con manual y aplicaciones. Cuéntanos qué necesitas y te mandamos un precio cerrado, sin costos que aparezcan después.',
    orden: 1,
  },
  {
    pregunta: '¿En cuánto tiempo entregan?',
    respuesta:
      'Una identidad de marca toma entre tres y cinco semanas. Una campaña de redes, una o dos. El gran formato depende de la imprenta, y eso lo confirmamos antes de empezar, no sobre la marcha.',
    orden: 2,
  },
  {
    pregunta: '¿Los archivos editables quedan míos?',
    respuesta:
      'Sí. Al cerrar el proyecto te entregamos los editables y el manual de marca. No dependes de nosotros para el siguiente cambio ni para trabajar con otro proveedor.',
    orden: 3,
  },
  {
    pregunta: '¿Trabajan fuera de la ciudad?',
    respuesta:
      'Sí, atendemos a todo Ecuador. El diseño se coordina a distancia sin problema; para gran formato e instalación revisamos antes la logística con la imprenta de la zona.',
    orden: 4,
  },
];

export const equipo: MiembroEquipo[] = [
  {
    nombre: 'Nombre del miembro',
    cargo: 'Diseño de marca',
    foto: { url: '', alt: 'Foto de ejemplo' },
    orden: 1,
  },
  {
    nombre: 'Nombre del miembro',
    cargo: 'Producción y gran formato',
    foto: { url: '', alt: 'Foto de ejemplo' },
    orden: 2,
  },
];
