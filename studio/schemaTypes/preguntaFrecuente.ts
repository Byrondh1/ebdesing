import { defineField, defineType } from 'sanity';

export const preguntaFrecuente = defineType({
  name: 'preguntaFrecuente',
  title: 'Pregunta frecuente',
  type: 'document',
  fields: [
    defineField({
      name: 'pregunta',
      title: 'Pregunta',
      description: 'Escríbela como la haría un cliente, no como la haría la agencia.',
      type: 'string',
      validation: (regla) => regla.required().max(150),
    }),
    defineField({
      name: 'respuesta',
      title: 'Respuesta',
      description:
        'Directa y completa. Google puede mostrarla tal cual en los resultados, así que debe entenderse sin haber leído la página.',
      type: 'text',
      rows: 4,
      validation: (regla) => regla.required().min(40),
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
  preview: { select: { title: 'pregunta', subtitle: 'respuesta' } },
});
