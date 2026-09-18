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
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          description: 'Describe la foto para quien no puede verla.',
          type: 'string',
          // Obligatorio SOLO si hay foto. Un required() a secas marcaría error en
          // todos los testimonios sin foto, que son válidos.
          validation: (regla) =>
            regla.custom((alt, contexto) => {
              const imagen = contexto.parent as { asset?: unknown } | undefined;
              if (!imagen?.asset) return true;
              return alt ? true : 'Si subes una foto, describe qué se ve en ella.';
            }),
        }),
      ],
    }),
    defineField({
      name: 'perfilGoogle',
      title: 'Enlace a la reseña en Google',
      description:
        'Opcional. Si el testimonio salió de una reseña pública, pega aquí su enlace para que quien quiera pueda comprobarla.',
      type: 'url',
    }),
  ],
  preview: {
    select: { title: 'nombreCliente', subtitle: 'empresa', media: 'foto' },
  },
});
