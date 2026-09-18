/**
 * Contrato entre el contenido y los componentes.
 *
 * Replican los schemas de Sanity (§4 del blueprint). Los componentes dependen de
 * estos tipos, no de Sanity: por eso el origen de los datos puede cambiar sin
 * tocar una sola sección.
 */

export interface Imagen {
  url: string;
  alt: string;
  ancho?: number;
  alto?: number;
}

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
  icono?: string;
  descripcionCorta: string;
  descripcionCompleta: string;
  orden: number;
}

export type CategoriaProyecto = 'diseño' | 'publicidad' | 'branding';

/** Servicio referenciado desde un proyecto: solo lo necesario para enlazarlo. */
export interface ServicioEnlazado {
  titulo: string;
  slug: string;
}

export interface Proyecto {
  titulo: string;
  slug: string;
  cliente: string;
  categoria: CategoriaProyecto;
  imagenPrincipal?: Imagen;
  galeria?: Imagen[];
  /** Resumen. Es también la base de la meta description de su página. */
  descripcion: string;
  /** Los tres tiempos del caso de éxito. `reto` y `solucion` son opcionales. */
  reto?: string;
  solucion?: string;
  resultado: string;
  /** Servicios que intervinieron, para enlazar en las dos direcciones. */
  servicios?: ServicioEnlazado[];
  destacado: boolean;
  orden: number;
}

export interface Testimonio {
  nombreCliente: string;
  empresa: string;
  cita: string;
  foto?: Imagen;
  /** Enlace a la reseña pública, si el testimonio salió de una. */
  perfilGoogle?: string;
}

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
  orden: number;
}

export interface MiembroEquipo {
  nombre: string;
  cargo: string;
  foto: Imagen;
  orden: number;
}
