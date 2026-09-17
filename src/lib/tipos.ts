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

export interface Proyecto {
  titulo: string;
  slug: string;
  cliente: string;
  categoria: CategoriaProyecto;
  imagenPrincipal?: Imagen;
  galeria?: Imagen[];
  descripcion: string;
  resultado: string;
  destacado: boolean;
  orden: number;
}

export interface Testimonio {
  nombreCliente: string;
  empresa: string;
  cita: string;
  foto?: Imagen;
}
