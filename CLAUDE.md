# EBDesing — Sitio Web

Sitio de marketing para EBDesing (agencia de diseño y publicidad, Ecuador). Astro + Tailwind 4 +
Sanity CMS + Cloudflare Pages. Ver `ebdesing-blueprint.md` en la raíz para el diseño completo,
orden de construcción y criterios de aceptación de cada paso — es la fuente de verdad.

## Reglas del proyecto
- Sin backend propio salvo `/api/cotizacion` (único endpoint).
- Sin blog en v1 — decisión explícita, no lo agregues sin que te lo pidan.
- Todo el contenido editable (portafolio, servicios, testimonios) vive en Sanity, nunca hardcodeado
  en componentes .astro.
- Tailwind 4 es CSS-first: tokens en `src/styles/global.css` con `@theme`, no `tailwind.config.js`.
- Mobile-first siempre: diseña en 360px antes que en desktop.
- Sigue el BUILD ORDER del blueprint en orden — no saltes pasos ni los combines.
- Cada paso tiene un "Done when" — no avances sin poder verificarlo.

## Stack fijado (§2 y §11 del blueprint)
No cambies versiones a ciegas; están verificadas contra npm el 2026-09-17.

| Paquete | Versión |
|---|---|
| `astro` | 7.3.3 (requiere Node >= 22.12.0) |
| `@astrojs/cloudflare` | 14.3.2 |
| `tailwindcss` + `@tailwindcss/vite` | 4.3.3 |
| `@sanity/client` | 8.6.2 |
| `resend` | 6.28.1 |
| `typescript` | `~6.0.3` (NO 7.x — ver Gotchas §2) |
| `wrangler` | 4.134.0 |

Trampas conocidas: usar `@tailwindcss/vite`, nunca `@astrojs/tailwind` (ese es de Tailwind 3), y no
mezclar los dos.

## Comandos
```bash
npm install
npm run dev                               # sitio Astro → localhost:4321
npm run build                             # debe salir con código 0
cd studio && npm install && npm run dev   # Sanity Studio → localhost:3333
```

## Secretos
Van como variables de entorno (Cloudflare Pages en producción, `.env` local que NO se commitea).
Ver `.env.example`. Nunca hardcodear `RESEND_API_KEY` ni el project id de Sanity en el código.

## Idioma
El proyecto y su contenido son en español (mercado: Ecuador). Escribe código, comentarios,
commits y copy del sitio en español.
