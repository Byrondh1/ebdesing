import { z } from 'zod';

/**
 * Forma del formulario de cotización (§5 del blueprint).
 *
 * El navegador valida antes de enviar, pero esta validación es la que manda: nunca
 * se confía en el cliente, que se puede saltar con un curl.
 */
export const esquemaCotizacion = z.object({
  nombre: z
    .string({ error: 'Falta el nombre.' })
    .trim()
    .min(2, 'El nombre es demasiado corto.')
    .max(100, 'El nombre es demasiado largo.'),

  email: z
    .string({ error: 'Falta el correo.' })
    .trim()
    .max(200, 'El correo es demasiado largo.')
    .pipe(z.email('El correo no tiene un formato válido.')),

  telefono: z.string().trim().max(30, 'El teléfono es demasiado largo.').optional().or(z.literal('')),

  servicioInteres: z.string().trim().max(100).optional().or(z.literal('')),

  mensaje: z.string().trim().max(2000, 'El mensaje es demasiado largo.').optional().or(z.literal('')),

  /**
   * Consentimiento de la política de privacidad.
   *
   * Se valida AQUÍ, no solo con el `required` del HTML: un `required` se salta con
   * dos clics en las herramientas del navegador o con un curl, y sin consentimiento
   * probado no hay base legal para tratar el dato. Un checkbox marcado llega como
   * 'on' en un formulario; se acepta también `true` por si el cliente manda JSON.
   */
  privacidad: z
    .union([z.literal('on'), z.literal(true)], {
      error: 'Hay que aceptar la política de privacidad para poder responderte.',
    }),

  /**
   * Trampa para bots: es un campo oculto que una persona nunca rellena. Si viene con
   * algo, el envío se descarta.
   */
  honeypot: z.string().optional(),
});

export type Cotizacion = z.infer<typeof esquemaCotizacion>;

/** Campos que el formulario marca como obligatorios en el navegador. */
export const CAMPOS_REQUERIDOS = ['nombre', 'email', 'privacidad'] as const;
