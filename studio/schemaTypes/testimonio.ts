import { defineField, defineType } from 'sanity';

export const testimonio = defineType({
  name: 'testimonio',
  title: 'Testimonio',
  type: 'document',
  fields: [
    defineField({
      name: 'nombreCliente',
      title: 'Nombre del cliente',
      type: 'string',
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'empresa',
      title: 'Empresa',
      type: 'string',
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'cita',
      title: 'Lo que dijo',
      description: 'Sus palabras, sin comillas: el sitio se las pone.',
      type: 'text',
      rows: 3,
      validation: (regla) => regla.required().max(300),
    }),
    defineField({
      name: 'foto',
      title: 'Foto',
      description: 'Opcional.',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Texto alternativo', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'nombreCliente', subtitle: 'empresa', media: 'foto' },
  },
});
