import { defineField, defineType } from 'sanity';

export const miembroEquipo = defineType({
  name: 'miembroEquipo',
  title: 'Miembro del equipo',
  type: 'document',
  fields: [
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'cargo',
      title: 'Cargo',
      description: 'Qué hace en EBDesing. Ejemplo: "Diseño de marca".',
      type: 'string',
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'foto',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          description: 'Describe la foto para quien no puede verla.',
          type: 'string',
          validation: (regla) => regla.required(),
        }),
      ],
      validation: (regla) => regla.required(),
    }),
    defineField({
      name: 'orden',
      title: 'Orden',
      description: 'Número más bajo, aparece antes. Vacío, va al final.',
      type: 'number',
      validation: (regla) => regla.integer().min(0),
    }),
  ],
  orderings: [
    { title: 'Orden manual', name: 'ordenManual', by: [{ field: 'orden', direction: 'asc' }] },
  ],
  preview: { select: { title: 'nombre', subtitle: 'cargo', media: 'foto' } },
});
