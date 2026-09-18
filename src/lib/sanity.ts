import { createClient } from '@sanity/client';
import { leerEnv } from './env';
import type {
  ConfiguracionSitio,
  MiembroEquipo,
  PreguntaFrecuente,
  Proyecto,
  Servicio,
  Testimonio,
} from './tipos';

const projectId = leerEnv('SANITY_PROJECT_ID');
const dataset = leerEnv('SANITY_DATASET') ?? 'production';
const apiVersion = leerEnv('SANITY_API_VERSION') ?? '2026-09-17';

if (!projectId) {
  throw new Error(
    'Falta SANITY_PROJECT_ID. Copia .env.example a .env y rellénalo, o exporta la variable ' +
      'antes de construir. Para trabajar sin red, usa USAR_CONTENIDO_LOCAL=1.'
  );
}

export const clienteSanity = createClient({
  projectId,
  dataset,
  apiVersion,
  // El dataset es público, así que no hace falta token de lectura.
  // useCdn:false porque el sitio se reconstruye por webhook justo después de publicar:
  // la CDN podría servir la versión anterior y el build saldría con contenido viejo.
  useCdn: false,
});

// Proyección reutilizable: resuelve la referencia del asset a una URL usable.
const IMAGEN = `{
  "url": asset->url,
  "alt": coalesce(alt, ""),
  "ancho": asset->metadata.dimensions.width,
  "alto": asset->metadata.dimensions.height
}`;

const CAMPOS_PROYECTO = `{
  titulo,
  "slug": slug.current,
  cliente,
  categoria,
  descripcion,
  reto,
  solucion,
  resultado,
  "servicios": servicios[]->{ titulo, "slug": slug.current },
  "destacado": coalesce(destacado, false),
  "orden": coalesce(orden, 999),
  "imagenPrincipal": imagenPrincipal${IMAGEN},
  "galeria": galeria[]${IMAGEN}
}`;

export async function obtenerProyectos(): Promise<Proyecto[]> {
  return clienteSanity.fetch(
    `*[_type == "proyecto"] | order(coalesce(orden, 999) asc, titulo asc) ${CAMPOS_PROYECTO}`
  );
}

export async function obtenerProyecto(slug: string): Promise<Proyecto | null> {
  return clienteSanity.fetch(
    `*[_type == "proyecto" && slug.current == $slug][0] ${CAMPOS_PROYECTO}`,
    { slug }
  );
}

export async function obtenerServicios(): Promise<Servicio[]> {
  return clienteSanity.fetch(`*[_type == "servicio"] | order(coalesce(orden, 999) asc) {
    titulo,
    "slug": slug.current,
    icono,
    descripcionCorta,
    descripcionCompleta,
    "orden": coalesce(orden, 999)
  }`);
}

export async function obtenerTestimonios(): Promise<Testimonio[]> {
  return clienteSanity.fetch(`*[_type == "testimonio"] {
    nombreCliente,
    empresa,
    cita,
    perfilGoogle,
    "foto": foto${IMAGEN}
  }`);
}

export async function obtenerPreguntas(): Promise<PreguntaFrecuente[]> {
  return clienteSanity.fetch(`*[_type == "preguntaFrecuente"] | order(coalesce(orden, 999) asc) {
    pregunta,
    respuesta,
    "orden": coalesce(orden, 999)
  }`);
}

export async function obtenerEquipo(): Promise<MiembroEquipo[]> {
  return clienteSanity.fetch(`*[_type == "miembroEquipo"] | order(coalesce(orden, 999) asc) {
    nombre,
    cargo,
    "foto": foto${IMAGEN},
    "orden": coalesce(orden, 999)
  }`);
}

export async function obtenerConfiguracion(): Promise<ConfiguracionSitio | null> {
  return clienteSanity.fetch(`*[_type == "configuracionSitio"][0] {
    telefonoWhatsapp,
    emailContacto,
    tiempoRespuesta,
    direccion,
    redesSociales
  }`);
}
