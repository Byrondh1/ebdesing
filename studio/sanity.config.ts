import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes, SINGLETONS } from './schemaTypes';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';

if (!projectId) {
  throw new Error(
    'Falta SANITY_STUDIO_PROJECT_ID. Copia studio/.env.example a studio/.env y rellénalo.'
  );
}

export default defineConfig({
  name: 'ebdesing',
  title: 'EBDesing',
  projectId,
  dataset,

  plugins: [
    structureTool({
      // Menú pensado para quien no es técnico: la configuración se abre directo
      // como un formulario, no como una lista con un solo elemento dentro.
      structure: (S) =>
        S.list()
          .title('Contenido')
          .items([
            S.listItem()
              .title('Configuración del sitio')
              .id('configuracionSitio')
              .child(
                S.document()
                  .schemaType('configuracionSitio')
                  .documentId('configuracionSitio')
                  .title('Configuración del sitio')
              ),
            S.divider(),
            S.documentTypeListItem('proyecto').title('Portafolio'),
            S.documentTypeListItem('servicio').title('Servicios'),
            S.documentTypeListItem('testimonio').title('Testimonios'),
            S.documentTypeListItem('preguntaFrecuente').title('Preguntas frecuentes'),
            S.documentTypeListItem('miembroEquipo').title('Equipo'),
          ]),
    }),
    visionTool({ defaultApiVersion: '2026-09-17' }),
  ],

  schema: {
    types: schemaTypes,
    // Sin plantilla de creación no aparece el botón de "nuevo" para los singletons.
    templates: (plantillas) =>
      plantillas.filter(({ schemaType }) => !SINGLETONS.includes(schemaType)),
  },

  document: {
    // Al singleton se le quitan las acciones de duplicar y borrar: debe existir
    // siempre y exactamente uno.
    actions: (acciones, { schemaType }) =>
      SINGLETONS.includes(schemaType)
        ? acciones.filter(
            ({ action }) =>
              action && ['publish', 'discardChanges', 'restore'].includes(action)
          )
        : acciones,
  },
});
