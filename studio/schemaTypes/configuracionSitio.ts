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
    defineField({
      name: 'direccion',
      title: 'Ubicación',
      description: 'Ciudad o dirección. Aparece en el pie y ayuda en las búsquedas locales.',
      type: 'string',
      validation: (regla) => regla.required(),
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
