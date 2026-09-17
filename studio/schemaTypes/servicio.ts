import { defineField, defineType } from 'sanity';

export const servicio = defineType({
  name: 'servicio',
  title: 'Servicio',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      validation: (regla) => regla.required().max(60),
    }),
    defineField({
      name: 'slug',
      title: 'Dirección web',
      type: 'slug',
      options: { source: 'titulo', maxLength: 60 },
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'icono',
      title: 'Icono',
      description: 'Nombre corto del icono. Por ahora no se usa en el sitio; déjalo vacío.',
      type: 'string',
    }),
    defineField({
      name: 'descripcionCorta',
      title: 'Descripción corta',
      description: 'La que se ve en la tarjeta de inicio. Una o dos frases.',
      type: 'text',
      rows: 3,
      validation: (regla) => regla.required().max(200),
    }),
    defineField({
      name: 'descripcionCompleta',
      title: 'Descripción completa',
      description: 'La que se ve en la página de Servicios.',
      type: 'text',
      rows: 5,
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'orden',
      title: 'Orden',
      description: 'Número más bajo, aparece antes.',
      type: 'number',
      validation: (regla) => regla.integer().min(0),
    }),
  ],
  orderings: [
    { title: 'Orden manual', name: 'ordenManual', by: [{ field: 'orden', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'titulo', subtitle: 'descripcionCorta' },
  },
});
