import type { APIRoute } from 'astro';
// En Astro 7 + @astrojs/cloudflare 14, `Astro.locals.runtime.env` ya NO existe: las
// variables del worker se leen de este módulo virtual, que solo resuelve dentro del
// runtime de Cloudflare.
import { env as envWorker } from 'cloudflare:workers';
import { esquemaCotizacion } from '../../lib/cotizacion';
import { ErrorEnvio, enviarCotizacion } from '../../lib/email';

/** Única ruta del sitio que se ejecuta en el servidor. El resto es estático. */
export const prerender = false;

const json = (cuerpo: unknown, status: number) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

/**
 * Las variables del worker vienen de `cloudflare:workers`; en Node (tests, otro
 * adaptador) de `process.env`. Se miran las dos, o el endpoint funciona en un sitio
 * y falla en el otro.
 *
 * Nada de `import.meta.env[nombre]`: Vite sustituye textualmente y no resuelve
 * accesos con nombre dinámico. Estos dos sí son objetos reales en runtime.
 */
function leerConfig() {
  const delWorker = (envWorker ?? {}) as Record<string, string | undefined>;
  const delProceso = (typeof process !== 'undefined' ? process.env : {}) as Record<
    string,
    string | undefined
  >;
  const leer = (nombre: string) => delWorker[nombre] || delProceso[nombre];

  return {
    resendApiKey: leer('RESEND_API_KEY'),
    contactEmail: leer('CONTACT_EMAIL'),
    // El modo simulado se niega a activarse en Cloudflare Pages, igual que el
    // contenido local: una cotización que no se envía es una venta perdida.
    simulado: leer('COTIZACION_SIMULADA') === '1' && !leer('CF_PAGES'),
  };
}

export const POST: APIRoute = async ({ request }) => {
  let datosCrudos: unknown;
  try {
    datosCrudos = await request.json();
  } catch {
    return json({ ok: false, error: 'El cuerpo de la petición no es JSON válido.' }, 400);
  }

  const resultado = esquemaCotizacion.safeParse(datosCrudos);

  if (!resultado.success) {
    // Se devuelve el detalle por campo para que el formulario lo pinte donde toca.
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? 'formulario');
      campos[campo] ??= problema.message;
    }
    return json({ ok: false, campos }, 400);
  }

  const datos = resultado.data;

  // Honeypot relleno: es un bot. Se responde 200 como si todo hubiera ido bien —
  // decirle que falló solo le enseña a esquivar la trampa la próxima vez.
  if (datos.honeypot) {
    return json({ ok: true }, 200);
  }

  // Se resuelve ANTES del try a propósito: si leer la configuración falla, eso no es
  // un fallo de envío y no debe disfrazarse de 502.
  const config = leerConfig();

  try {
    await enviarCotizacion(datos, config);
  } catch (error) {
    const detalle = error instanceof ErrorEnvio ? error.message : String(error);
    console.error('[cotizacion] fallo al enviar:', detalle);
    // 502: la petición era correcta, el fallo es nuestro. El formulario ofrece
    // WhatsApp como alternativa para no perder el contacto.
    return json({ ok: false, error: 'No pudimos enviar tu mensaje.' }, 502);
  }

  return json({ ok: true }, 200);
};

/** Cualquier otro método sobre esta ruta. */
export const ALL: APIRoute = () => json({ ok: false, error: 'Método no permitido.' }, 405);
