import { defineField, defineType } from 'sanity';

export const proyecto = defineType({
  name: 'proyecto',
  title: 'Proyecto del portafolio',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      validation: (regla) => regla.required().max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Dirección web',
      description:
        'Se genera sola desde el título. Si la cambias después de publicar, el enlace viejo deja de funcionar.',
      type: 'slug',
      options: { source: 'titulo', maxLength: 80 },
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'cliente',
      title: 'Cliente',
      type: 'string',
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'categoria',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          { title: 'Diseño', value: 'diseño' },
          { title: 'Publicidad', value: 'publicidad' },
          { title: 'Branding', value: 'branding' },
        ],
        layout: 'radio',
      },
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'imagenPrincipal',
      title: 'Imagen principal',
      description: 'La que se ve en el listado y al compartir el enlace en redes.',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          description:
            'Describe la imagen para quien no puede verla. También lo lee Google.',
          type: 'string',
          validation: (regla) => regla.required(),
        }),
      ],
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'galeria',
      title: 'Galería',
      description: 'Imágenes adicionales del proyecto. Opcional.',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texto alternativo',
              type: 'string',
              validation: (regla) => regla.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'descripcion',
      title: 'Resumen',
      description:
        'Dos o tres frases que expliquen el proyecto entero. Es lo que se ve en el listado y lo que Google muestra como descripción en los resultados, así que debe entenderse suelto.',
      type: 'text',
      rows: 4,
      validation: (regla) => regla.required().min(40),
    }),

    // Los tres campos del caso de éxito. Van juntos y en este orden porque así se
    // lee la historia: qué pasaba, qué hicimos, en qué quedó.
    defineField({
      name: 'reto',
      title: 'El reto',
      description: 'Con qué problema llegó el cliente. Sin adornos: qué no le estaba funcionando.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'solucion',
      title: 'La solución',
      description: 'Qué hicimos y por qué ese camino y no otro.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'resultado',
      title: 'El resultado',
      description: 'El "después": qué quedó entregado o qué consiguió el cliente.',
      type: 'text',
      rows: 2,
      validation: (regla) => regla.required(),
    }),

    defineField({
      name: 'servicios',
      title: 'Servicios que intervinieron',
      description:
        'Enlaza este proyecto con los servicios que lo hicieron posible. Sirve para que desde cada servicio se llegue a ejemplos reales, y al revés.',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'servicio' }] }],
      validation: (regla) => regla.unique(),
    }),
    defineField({
      name: 'destacado',
      title: 'Mostrar en la página de inicio',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'orden',
      title: 'Orden',
      description: 'Número más bajo, aparece antes. Si lo dejas vacío, va al final.',
      type: 'number',
      validation: (regla) => regla.integer().min(0),
    }),
  ],
  orderings: [
    {
      title: 'Orden manual',
      name: 'ordenManual',
      by: [{ field: 'orden', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'titulo', subtitle: 'cliente', media: 'imagenPrincipal', destacado: 'destacado' },
    prepare: ({ title, subtitle, media, destacado }) => ({
      title: destacado ? `★ ${title}` : title,
      subtitle,
      media,
    }),
  },
});
