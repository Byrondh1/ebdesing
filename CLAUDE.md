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
  (paso 8), `@sanity/client` (paso 6), `wrangler` (paso 14).

## Estado actual
Pasos 1-5 y 9 del BUILD ORDER completos. `npm run build` en 0, 7 páginas.

- **Layout:** `Base.astro` recibe `titulo`/`descripcion`/`ogImagen`/`noindex`/`jsonLd` y arma head,
  OG, Twitter, canonical, JSON-LD y skip-link. `Header` y `Footer` leen la nav de `src/lib/nav.ts`.
- **Sistema de diseño:** `Button` (primario/secundario/contorno × sm/md/lg), `Badge`, `Card`.
- **Páginas:** Home, Servicios, Sobre nosotros, 404 propio, y maquetas de Portafolio y Contacto.
- **SEO (paso 9):** sitemap con `/components-preview` y `/404` excluidas, `robots.txt`, JSON-LD
  (`Organization`, `WebSite`, `ItemList` de `Service`, `BreadcrumbList`) e imagen OG propia por página.

## Comandos propios
```bash
npm run build          # incluye postbuild: auditoría SEO que ROMPE el build si algo falla
npm run auditar-seo    # la auditoría suelta, sobre dist/
npm run marcadores     # lista lo que falta reemplazar antes del deploy (sale 1 si queda algo)
npm run generar-og     # regenera public/og/*.png (necesita: npx playwright install chromium)
```

### Reglas de datos estructurados
Un dato estructurado falso es peor que uno ausente. `seo.ts` **omite** el teléfono mientras sea
`TELEFONO_MARCADOR` y omite de `sameAs` las URLs de redes que apuntan a la portada de la plataforma
en vez de a un perfil. Al poner los datos reales aparecen solos; no hay que tocar `seo.ts`.

### Imágenes OG
Los PNG de `public/og/` se **commitean**: son artefactos, no se generan en cada build, para que el
deploy no dependa de un navegador headless ni de las fuentes de la máquina que construye. Si cambian
los títulos de `scripts/og.config.mjs`, los colores de marca **o el dominio**, hay que regenerarlos.

### Temporal, se borra o se reemplaza
Corre `npm run marcadores` para la lista viva. En resumen: dominio, WhatsApp, correo, dirección,
redes, logo del JSON-LD, `/components-preview` y el módulo `contenido-temporal.ts`.

### Ojo con las fuentes
`public/fonts/` ya tiene Archivo Black e Inter (variable, un solo archivo cubre todos los pesos),
pero **solo las usa el generador de OG**. El sitio aún cae a las fuentes del sistema: el `@font-face`
con preload es el paso 11. Hasta entonces las tarjetas OG y el sitio no se ven con la misma tipografía.

### Trampas encontradas (no las repitas)
- Astro **colapsa el salto de línea que precede a un `<span>`** y se come el espacio entre palabras.
- Los comentarios `<!-- -->` en plantillas .astro **se envían al navegador**. Usa `{/* */}`.
- Un hijo de contenedor flex se estira por `align-items: stretch`: `Badge` lleva `w-fit self-start`.
- Inter en Google Fonts v20 es variable: los "distintos pesos" descargan el mismo archivo.

Siguiente: paso 6, integración con Sanity (requiere el project ID de Byron).
