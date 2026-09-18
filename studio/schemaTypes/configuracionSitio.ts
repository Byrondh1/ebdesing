import { defineField, defineType } from 'sanity';

/**
 * Singleton: existe UN solo documento de este tipo. La configuración del Studio
 * impide crear más y esconde la opción de borrarlo.
 *
 * Sin este documento el sitio no construye: de aquí salen el WhatsApp, el correo
 * y las redes que aparecen en el footer, en contacto y en los datos estructurados.
 */
export const configuracionSitio = defineType({
  name: 'configuracionSitio',
  title: 'Configuración del sitio',
  type: 'document',
  fields: [
    defineField({
      name: 'telefonoWhatsapp',
      title: 'WhatsApp',
      description:
        'Solo números, con código de país y sin + ni espacios. Ecuador es 593 y se quita el 0 inicial: 0991234567 se escribe 593991234567.',
      type: 'string',
      validation: (regla) =>
        regla
          .required()
          .regex(/^\d{10,15}$/, {
            name: 'solo dígitos',
            invert: false,
          })
          .error('Solo números, entre 10 y 15 dígitos. Sin +, sin espacios y sin guiones.'),
    }),
    defineField({
      name: 'emailContacto',
      title: 'Correo de contacto',
      description: 'Aquí llegan las cotizaciones del formulario.',
      type: 'string',
      validation: (regla) => regla.required().email(),
    }),
    // --- Datos del responsable del tratamiento (LOPDP) ---
    // Sin estos dos, la política de privacidad no identifica a quién reclamar, que es
    // justo lo que la ley obliga a decir.
    defineField({
      name: 'razonSocial',
      title: 'Razón social',
      description:
        'El nombre legal con el que está registrada la empresa, no el comercial. Aparece en la política de privacidad como responsable de los datos.',
      type: 'string',
    }),
    defineField({
      name: 'ruc',
      title: 'RUC',
      description: '13 dígitos, sin guiones ni espacios.',
      type: 'string',
      validation: (regla) =>
        regla
          .regex(/^\d{13}$/, { name: 'RUC' })
          .error('El RUC son 13 dígitos seguidos, sin guiones ni espacios.'),
    }),

    defineField({
      name: 'tiempoRespuesta',
      title: 'Tiempo de respuesta',
      description:
        'Aparece junto al formulario y junto al botón de WhatsApp. Es una promesa al cliente: pon un plazo que se pueda cumplir siempre, no el mejor caso.',
      type: 'string',
      validation: (regla) => regla.required().max(80),
      initialValue: 'Respondemos en menos de 24 horas hábiles.',
    }),
    defineField({
      name: 'direccion',
      title: 'Ubicación',
      description: 'Ciudad o dirección. Aparece en el pie y ayuda en las búsquedas locales.',
      type: 'string',
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'local',
      title: 'Local físico',
      description:
        'Rellénalo solo si atendéis en una dirección concreta. Con la calle y la ciudad puestas, el sitio publica los datos de negocio local que Google usa para el mapa y el panel lateral, y muestra la ubicación en Contacto.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'calle',
          title: 'Calle y número',
          type: 'string',
        }),
        defineField({ name: 'ciudad', title: 'Ciudad', type: 'string' }),
        defineField({ name: 'provincia', title: 'Provincia', type: 'string' }),
        defineField({ name: 'codigoPostal', title: 'Código postal', type: 'string' }),
        defineField({
          name: 'fachada',
          title: 'Foto de la fachada',
          description:
            'Se muestra en lugar del mapa hasta que alguien lo pide. Así la página no carga nada de Google mientras nadie toca el mapa.',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texto alternativo',
              type: 'string',
              validation: (regla) =>
                regla.custom((alt, contexto) => {
                  const imagen = contexto.parent as { asset?: unknown } | undefined;
                  if (!imagen?.asset) return true;
                  return alt ? true : 'Describe qué se ve en la foto.';
                }),
            }),
          ],
        }),
        defineField({
          name: 'mapaIncrustado',
          title: 'Dirección del mapa para incrustar',
          description:
            'En Google Maps: busca el local → Compartir → Insertar un mapa → copia SOLO la dirección que aparece dentro de src="…". Si lo dejas vacío, no se muestra mapa.',
          type: 'url',
        }),
        defineField({
          name: 'enlaceMapa',
          title: 'Enlace para abrir en Google Maps',
          description: 'Opcional. El enlace normal de Google Maps, para quien prefiera abrirlo aparte.',
          type: 'url',
        }),
      ],
    }),
    defineField({
      name: 'redesSociales',
      title: 'Redes sociales',
      description:
        'Pega la dirección completa del perfil, no la de la plataforma. Si dejas una vacía, no se muestra.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'instagram',
          title: 'Instagram',
          type: 'url',
          description: 'Ejemplo: https://instagram.com/tu-usuario',
        }),
        defineField({ name: 'facebook', title: 'Facebook', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok', type: 'url' }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Configuración del sitio' }),
  },
});
