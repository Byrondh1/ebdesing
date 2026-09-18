import type { APIRoute } from 'astro';

/**
 * robots.txt generado, no escrito a mano.
 *
 * El dominio sale de `site` en astro.config.mjs, así que cuando EBDesing confirme
 * el definitivo no hay que acordarse de editar este archivo también.
 */
export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Falta `site` en astro.config.mjs: sin él no hay URL de sitemap.');

  const cuerpo = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
    '',
  ].join('\n');

  return new Response(cuerpo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
