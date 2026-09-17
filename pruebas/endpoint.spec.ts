import { test, expect } from '@playwright/test';
import { cotizacionValida } from './rutas';

/**
 * Reglas del endpoint (§5 del blueprint) contra el servidor real.
 *
 * El caso de envío correcto necesita Resend o COTIZACION_SIMULADA=1 en .dev.vars.
 * Sin eso el endpoint responde 502 y la prueba se salta con motivo, en vez de dar
 * un falso verde o un falso rojo.
 */
test.describe('Endpoint /api/cotizacion', () => {
  test('falta un campo obligatorio: 400 diciendo cuál', async ({ request }) => {
    const r = await request.post('/api/cotizacion', { data: { email: 'a@b.com' } });
    expect(r.status()).toBe(400);
    expect((await r.json()).campos).toHaveProperty('nombre');
  });

  test('correo mal formado: 400 señalando el correo', async ({ request }) => {
    const r = await request.post('/api/cotizacion', {
      data: { ...cotizacionValida, email: 'esto-no-es-un-correo' },
    });
    expect(r.status()).toBe(400);
    expect((await r.json()).campos).toHaveProperty('email');
  });

  test('honeypot relleno: 200 y no se envía nada', async ({ request }) => {
    const r = await request.post('/api/cotizacion', {
      data: { ...cotizacionValida, honeypot: 'http://spam.example' },
    });
    // 200 a propósito: decirle al bot que falló solo le enseña a esquivar la trampa.
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
  });

  test('cuerpo que no es JSON: 400, no un 500', async ({ request }) => {
    const r = await request.post('/api/cotizacion', {
      headers: { 'Content-Type': 'application/json' },
      data: 'esto no es json',
    });
    expect(r.status()).toBe(400);
  });

  test('GET sobre la ruta: 405', async ({ request }) => {
    const r = await request.get('/api/cotizacion');
    expect(r.status()).toBe(405);
  });

  test('envío correcto: 200 {ok:true}', async ({ request }) => {
    const r = await request.post('/api/cotizacion', { data: cotizacionValida });
    test.skip(
      r.status() === 502,
      'Sin RESEND_API_KEY ni COTIZACION_SIMULADA=1 en .dev.vars: el envío no puede completarse'
    );
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
  });
});
