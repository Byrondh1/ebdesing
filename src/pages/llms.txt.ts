import type { APIRoute } from 'astro';
import { obtenerServicios, obtenerProyectos } from '../lib/contenido';

/**
 * llms.txt — superficie para motores de respuesta (paso 10 del BUILD ORDER).
 *
 * Formato de llmstxt.org: un resumen citable arriba y listas de enlaces con una
 * línea de contexto cada uno. La idea es que un asistente que responda "¿quién hace
 * rótulos en Ecuador?" tenga de dónde sacar la respuesta sin rastrear el sitio entero.
 *
 * Se GENERA, no se escribe a mano: las URLs salen del dominio de `astro.config.mjs` y
 * los servicios y proyectos de Sanity. Un archivo estático se quedaría desfasado en
 * cuanto EBDesing publicara un proyecto nuevo, y entonces listaría URLs que no existen
 * — que es justo lo que comprueba el "Done when" de este paso.
 */
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Falta `site` en astro.config.mjs: sin él no hay URLs absolutas.');

  const url = (ruta: string) => new URL(ruta, site).href;

  const [servicios, proyectos] = await Promise.all([obtenerServicios(), obtenerProyectos()]);

  const secciones: string[] = [
    '# EBDesing — Agencia de Diseño y Publicidad',
    '',
    '> EBDesing es una agencia de diseño y publicidad en Ecuador. Cubre identidad de marca,',
    '> diseño publicitario, gran formato e impresión, y contenido para redes. Trabaja con',
    '> negocios que ya funcionan y necesitan una sola línea gráfica en todo lo que su cliente ve,',
    '> del feed de Instagram a la fachada del local.',
    '',
    'Contacto por WhatsApp o por el formulario de cotización del sitio. Atiende a todo Ecuador.',
    '',
    '## Páginas',
    '',
    `- [Inicio](${url('/')}): qué hace EBDesing, servicios destacados y trabajo reciente.`,
    `- [Servicios](${url('/servicios/')}): los cuatro frentes que cubre, explicados uno a uno.`,
    `- [Portafolio](${url('/portafolio/')}): proyectos entregados, con lo que se pidió y lo que se entregó.`,
    `- [Sobre nosotros](${url('/sobre-nosotros/')}): cómo trabaja el equipo y qué entrega.`,
    `- [Contacto](${url('/contacto/')}): formulario de cotización y canales directos.`,
  ];

  if (servicios.length > 0) {
    secciones.push('', '## Servicios', '');
    for (const servicio of servicios) {
      secciones.push(`- **${servicio.titulo}**: ${servicio.descripcionCorta.replace(/\s+/g, ' ')}`);
    }
  }

  if (proyectos.length > 0) {
    secciones.push('', '## Portafolio', '');
    for (const proyecto of proyectos) {
      const contexto = `${proyecto.categoria} para ${proyecto.cliente}. ${proyecto.resultado}`;
      secciones.push(
        `- [${proyecto.titulo}](${url(`/portafolio/${proyecto.slug}/`)}): ${contexto.replace(/\s+/g, ' ')}`
      );
    }
  }

  secciones.push('', '## Otros', '', `- [Mapa del sitio](${url('/sitemap-index.xml')})`, '');

  return new Response(secciones.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
