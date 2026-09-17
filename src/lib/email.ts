import { Resend } from 'resend';
import type { Cotizacion } from './cotizacion';

export interface ConfiguracionEmail {
  resendApiKey?: string;
  contactEmail?: string;
  /** Solo desarrollo: registra el correo en consola en vez de enviarlo. */
  simulado?: boolean;
}

export class ErrorEnvio extends Error {}

const escapar = (texto: string) =>
  texto.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);

function cuerpo(datos: Cotizacion): { asunto: string; html: string; texto: string } {
  const filas: Array<[string, string]> = [
    ['Nombre', datos.nombre],
    ['Correo', datos.email],
    ['Teléfono', datos.telefono || '—'],
    ['Servicio', datos.servicioInteres || '—'],
    ['Mensaje', datos.mensaje || '—'],
  ];

  return {
    asunto: `Cotización de ${datos.nombre}`,
    texto: filas.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: `<h2>Nueva cotización</h2><table cellpadding="6">${filas
      .map(
        ([k, v]) =>
          `<tr><td><strong>${escapar(k)}</strong></td><td>${escapar(v).replace(/\n/g, '<br>')}</td></tr>`
      )
      .join('')}</table>`,
  };
}

/**
 * Manda la cotización al correo de EBDesing.
 *
 * El `replyTo` es el correo de quien cotiza: así responder desde la bandeja le llega
 * directo al cliente, sin copiar y pegar la dirección.
 */
export async function enviarCotizacion(
  datos: Cotizacion,
  config: ConfiguracionEmail
): Promise<void> {
  const { asunto, html, texto } = cuerpo(datos);

  if (config.simulado) {
    console.log(`\n  ✉ COTIZACIÓN SIMULADA (no se envió)\n  Para: ${config.contactEmail ?? '(sin destino)'}\n  Asunto: ${asunto}\n${texto.split('\n').map((l) => '  ' + l).join('\n')}\n`);
    return;
  }

  if (!config.resendApiKey) throw new ErrorEnvio('Falta RESEND_API_KEY.');
  if (!config.contactEmail) throw new ErrorEnvio('Falta CONTACT_EMAIL.');

  const resend = new Resend(config.resendApiKey);

  // TODO(Byron): `from` debe ser un dominio verificado en Resend. Mientras no haya
  // dominio propio confirmado, onboarding@resend.dev solo entrega al correo de la
  // cuenta de Resend — sirve para probar, no para producción.
  const { error } = await resend.emails.send({
    from: 'EBDesing <onboarding@resend.dev>',
    to: [config.contactEmail],
    replyTo: datos.email,
    subject: asunto,
    html,
    text: texto,
  });

  if (error) throw new ErrorEnvio(error.message ?? 'Resend rechazó el envío.');
}
