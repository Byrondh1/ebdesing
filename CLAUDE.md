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
| `@astrojs/sitemap` | 3.7.4 (añadido en el paso 9; no está en §11 del blueprint) |
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
  (paso 8), `wrangler` (paso 14).
- **@sanity/image-url no se usa:** la CDN de Sanity acepta transformaciones por query string,
  así que `src/lib/imagenes.ts` las arma a mano y nos ahorramos la dependencia.

## Estado actual
Pasos 1-7 y 9 del BUILD ORDER completos. Faltan el 8 (formulario) y el 10-14.

### Cómo fluye el contenido
```
Sanity ──> src/lib/sanity.ts ──┐
                               ├──> src/lib/contenido.ts ──> páginas ──> componentes
contenido-temporal.ts ─────────┘         (decide cuál)                    (solo tipos)
```
- **Las páginas SOLO importan de `contenido.ts`.** Nunca de `sanity.ts` ni de
  `contenido-temporal.ts`. Los componentes de sección solo importan tipos de `tipos.ts`.
- `contenido.ts` memoiza: sin eso se repetiría la misma consulta una vez por página.
- `imagenes.ts` está separado de `sanity.ts` porque este último lanza si falta configuración,
  y `recortar()` debe funcionar también con contenido local.

### Construir sin Sanity
```bash
USAR_CONTENIDO_LOCAL=1 npm run build   # contenido de ejemplo, NO sirve para publicar
```
Es opt-in a propósito: por defecto el build **falla** si no puede hablar con Sanity — mejor un
deploy roto que uno que publica en silencio un portafolio vacío. Además se niega a arrancar si
detecta `CF_PAGES`, para que la variable no se cuele en el panel de Cloudflare.

### Studio
`studio/` es un proyecto npm aparte, con su propio `npm install` y su propio `.env`
(`SANITY_STUDIO_PROJECT_ID`). `configuracionSitio` es un singleton: sin plantilla de creación
y sin acciones de borrar ni duplicar. Ver `studio/README.md`.

`npm audit` en `studio/` reporta 14 vulnerabilidades (2 altas: `js-yaml`, `smol-toml`), todas
transitivas de las herramientas de build del Studio. **No las arregles con `audit fix --force`**:
degrada `sanity` a la v5, que rompe esta config. No afectan al sitio publicado — el proyecto raíz
tiene 0 vulnerabilidades.

## Comandos propios
```bash
npm run build          # postbuild: auditoría SEO que ROMPE el build si algo falla
npm run auditar-seo    # la auditoría suelta, sobre dist/
npm run marcadores     # bloqueantes y recordatorios antes del deploy
npm run generar-og     # regenera public/og/*.png (necesita: npx playwright install chromium)
```

### Reglas de datos estructurados
Un dato estructurado falso es peor que uno ausente. `seo.ts` omite el teléfono mientras sea
`TELEFONO_MARCADOR` y descarta de `sameAs` las URLs que apuntan a la portada de la plataforma
en vez de a un perfil. Al poner los datos reales en Sanity aparecen solos.

### Imágenes OG
Los PNG de `public/og/` se **commitean**: son artefactos, para que el deploy no dependa de un
navegador headless ni de las fuentes de la máquina que construye. Las páginas de proyecto usan en
cambio su `imagenPrincipal` de Sanity, que es una URL externa — por eso la auditoría solo comprueba
en disco las imágenes del mismo origen.

### Ojo con las fuentes
`public/fonts/` tiene Archivo Black e Inter (variable, un archivo cubre todos los pesos), pero
**solo las usa el generador de OG**. El sitio aún cae a las fuentes del sistema: el `@font-face`
con preload es el paso 11. Hasta entonces las tarjetas OG y el sitio no comparten tipografía.

### Trampas encontradas (no las repitas)
- Astro **colapsa el salto de línea que precede a un `<span>`** y se come el espacio entre palabras.
- Los comentarios `<!-- -->` en plantillas .astro **se envían al navegador**. Usa `{/* */}`.
- Un hijo de contenedor flex se estira por `align-items: stretch`: `Badge` lleva `w-fit self-start`.
- Inter en Google Fonts v20 es variable: los "distintos pesos" descargan el mismo archivo.
- Un `export ... from './sanity'` carga ese módulo (y su `throw`) aunque no se use el símbolo:
  por eso `recortar` vive en `imagenes.ts`.

Siguiente: paso 8, formulario de cotización con `@astrojs/cloudflare` y Resend.
