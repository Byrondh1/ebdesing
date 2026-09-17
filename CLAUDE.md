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

## Divergencias con el blueprint (decididas, no las "corrijas")
- **Tokens de color:** el blueprint §7 los llama `brand-yellow`; en el código son
  **`brand-gold`** / `brand-gold-dark` (mismos hex). Usa los nombres del código.
- **Scaffold:** se creó a mano, no con `npm create astro@latest`. La política de egress de
  las sesiones de Claude Code en web bloquea `github.com`/`codeload.github.com`, y ese comando
  descarga la plantilla desde ahí. El resultado es equivalente a la plantilla `minimal`.
- **Aún sin instalar** (llegan en su paso del BUILD ORDER): `@astrojs/cloudflare` y `resend`
  (paso 8), `@sanity/client` (paso 6), `wrangler` (paso 14).

## Estado actual
Pasos 1-5 del BUILD ORDER completos. `npm run build` en 0, 7 páginas.

- **Layout:** `Base.astro` recibe `titulo`/`descripcion`/`ogImagen`/`noindex` y arma head, OG,
  canonical y skip-link. `Header` y `Footer` leen la nav de `src/lib/nav.ts` — fuente única.
- **Sistema de diseño:** `Button` (primario/secundario/contorno × sm/md/lg), `Badge`, `Card`.
- **Páginas:** Home (Hero, Servicios, Proyectos, Testimonios, CTA), Servicios, Sobre nosotros,
  404 propio, y maquetas de Portafolio y Contacto.

### Temporal, se borra o se reemplaza
- `src/pages/components-preview.astro` — **bórrala antes del deploy** (paso 3).
- `src/lib/contenido-temporal.ts` — datos con la forma exacta de los schemas de Sanity §4.
  Los componentes reciben todo por props, así que el paso 6 solo cambia de dónde salen los datos;
  las secciones no se tocan.
- `/portafolio` y `/contacto` son maquetas: les falta el fetch a Sanity (paso 7) y el formulario
  con su endpoint (paso 8).
- `site` en `astro.config.mjs` y los datos de `configuracionSitio` son marcadores: hay que poner
  el dominio, teléfono, correo y redes reales.

### Trampas encontradas (no las repitas)
- Astro **colapsa el salto de línea que precede a un `<span>`** y se come el espacio entre
  palabras. Texto y spans en la misma línea.
- Los comentarios `<!-- -->` en plantillas .astro **se envían al navegador**. Usa `{/* */}`.
- Un hijo de contenedor flex se estira por `align-items: stretch`: `Badge` lleva `w-fit self-start`.

Siguiente: paso 6, integración con Sanity (requiere el project ID de Byron).
