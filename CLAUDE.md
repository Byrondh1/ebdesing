# EBDesing — Sitio Web

Sitio de marketing para EBDesing (agencia de diseño y publicidad, Ecuador). Astro + Tailwind 4 +
Sanity CMS + **Cloudflare Workers** (el blueprint dice Pages; ver Divergencias). Ver `ebdesing-blueprint.md` en la raíz para el diseño completo,
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

## Secretos — hay DOS clases de variables, y no se mezclan

| | Dónde | Cuáles | Se leen con |
|---|---|---|---|
| **Build** | `.env` (ver `.env.example`) | `SANITY_*`, `USAR_CONTENIDO_LOCAL` | `leerEnv()` de `src/lib/env.ts` |
| **Runtime del worker** | `.dev.vars` en local, `wrangler secret put` en producción | `RESEND_API_KEY`, `CONTACT_EMAIL`, `COTIZACION_SIMULADA` | `import { env } from 'cloudflare:workers'` |

Poner una de runtime en `.env` **no hace nada**: el endpoint no la ve. Y al revés igual.
`.dev.vars` está en `.gitignore` — nunca lo commitees, lleva la clave de Resend.

`astro dev` lee `.dev.vars` de la raíz; `astro preview` levanta wrangler, que lo busca en
`dist/server/`. El script `prepreview` lo copia solo, así que `npm run preview` ya funciona.

## Idioma
El proyecto y su contenido son en español (mercado: Ecuador). Escribe código, comentarios,
commits y copy del sitio en español.

## Divergencias con el blueprint (decididas, no las "corrijas")
- **Tokens de color:** el blueprint §7 los llama `brand-yellow`; en el código son
  **`brand-gold`** / `brand-gold-dark` (mismos hex). Usa los nombres del código.
- **Scaffold:** se creó a mano, no con `npm create astro@latest`. La política de egress de
  las sesiones de Claude Code en web bloquea `github.com`/`codeload.github.com`, y ese comando
  descarga la plantilla desde ahí. El resultado es equivalente a la plantilla `minimal`.
- **Aún sin instalar**: `wrangler` como dependencia directa (paso 14); el adaptador ya lo trae.
- **⚠ Se despliega a Cloudflare WORKERS, no a Pages.** El blueprint §12 dice Pages, pero
  `@astrojs/cloudflare` 14.x genera un `wrangler.json` de Workers con Static Assets
  (`assets.directory: ../client`). Esto cambia el paso 14: no hay "Deploy Hook de Pages" para el
  webhook de Sanity, y la variable de entorno del build es `WORKERS_CI`, no `CF_PAGES`.
- **El formulario NO es una isla de React.** §3 del blueprint dibuja
  `islands/FormularioCotizacion.tsx` con `client:load`, pero §6 recomienda un componente Astro
  con `<script>` inline para no traer React por un solo formulario. Se siguió §6.
- **`zod` añadido** (no está en §11): valida el endpoint en servidor. Solo servidor — en el
  navegador la validación es nativa, para no enviar zod al cliente.
- **@sanity/image-url no se usa:** la CDN de Sanity acepta transformaciones por query string,
  así que `src/lib/imagenes.ts` las arma a mano y nos ahorramos la dependencia.

## Estado actual
Pasos 1-13 del BUILD ORDER completos. Falta el **14** (deploy). Ver `docs/despliegue.md`.

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
detecta que quien construye es Cloudflare (`CF_PAGES` en Pages, **`WORKERS_CI` en Workers**, que
es lo que usa este proyecto), para que la variable no se cuele en el panel.

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
npm run auditar-activos # peso de imágenes y fuentes propias (también en postbuild)
npm run pruebas        # suite E2E + accesibilidad (Playwright). Construye y sirve sola.
npm run typecheck      # tsc --noEmit. El build NO comprueba tipos: córrelo aparte.
npm run lighthouse     # levanta el preview antes. URL_BASE=https://... para producción
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

### Fuentes (paso 11)
Autoalojadas en `public/fonts/`, servidas por nosotros: **cero peticiones a terceros**, verificado
en navegador. `@font-face` en `global.css` con `font-display: swap` y preload en `Base.astro`.

- El `crossorigin` del preload es **obligatorio** aunque la fuente sea del mismo origen. Sin él el
  navegador se la descarga dos veces.
- Inter v20 es variable: un archivo cubre de 100 a 900.
- **No se subsetean más** a los caracteres usados. Los títulos y descripciones vienen de Sanity, así
  que el texto es impredecible y recortar glifos rompería contenido que aún no existe. Se usan los
  subsets `latin` de Google, que cubren tildes, ñ y ¿ ¡.
- `unicode-range` hace que un carácter fuera de ese rango caiga a la fuente del sistema en vez de
  salir como un cuadrado vacío.
- Para **reemplazar** una fuente hay que **cambiarle el nombre al archivo**: `_headers` las cachea
  un año como `immutable`, así que con el mismo nombre los navegadores se quedarían con la vieja.

### Imágenes (paso 11)
- Las de Sanity se piden con `auto=format` (la CDN sirve AVIF o WebP según el navegador) y `q=75`,
  con `srcset` y `sizes` para no bajar una de 1600px a un móvil de 360. Ver `src/lib/imagenes.ts`.
- `width` y `height` explícitos en todas, que es lo que mantiene el CLS a raya.
- `scripts/auditar-activos.mjs` corre en postbuild y **rompe el build** si una imagen propia pasa de
  200KB o una fuente de 100KB. Las de Sanity no pasan por ahí: viven en su CDN y se acotan por URL.
- `public/_headers` **se fusiona** con el que genera el adaptador, no lo pisa. Comprobado.

### Trampas encontradas (no las repitas)
- Astro **colapsa el salto de línea que precede a un `<span>`** y se come el espacio entre palabras.
- Los comentarios `<!-- -->` en plantillas .astro **se envían al navegador**. Usa `{/* */}`.
- Un hijo de contenedor flex se estira por `align-items: stretch`: `Badge` lleva `w-fit self-start`.
- Inter en Google Fonts v20 es variable: los "distintos pesos" descargan el mismo archivo.
- Un `export ... from './sanity'` carga ese módulo (y su `throw`) aunque no se use el símbolo:
  por eso `recortar` vive en `imagenes.ts`.

### Formulario de cotización (paso 8)
- `/api/cotizacion` es la **única** ruta con `export const prerender = false`. Todo lo demás
  se prerenderiza; el adaptador está solo para poder ejecutar esa ruta en el edge.
- Validación en dos capas: nativa del navegador antes de tocar la red (un campo obligatorio
  vacío no genera petición) y zod en el servidor, que es la que manda.
- El honeypot relleno devuelve **200 sin enviar**: decirle al bot que falló solo le enseña.
- Si Resend falla, 502 y el formulario ofrece WhatsApp — no se pierde el contacto.
- `COTIZACION_SIMULADA=1` registra el correo en consola en vez de enviarlo. Se niega a
  activarse si detecta `CF_PAGES` o **`WORKERS_CI`**, igual que el contenido local. Mirar solo
  `CF_PAGES` dejaba el freno sin efecto: este proyecto despliega a Workers, no a Pages.

### Trampas del adaptador de Cloudflare (costaron tiempo, no las repitas)
- **`Astro.locals.runtime.env` ya no existe** en Astro 7 + adaptador 14. Es
  `import { env } from 'cloudflare:workers'`. Acceder al viejo lanza, y si lo haces dentro de
  un `try` de envío se disfraza de 502 y parece que falló Resend.
- **`import.meta.env[nombre]` con nombre dinámico NUNCA funciona.** Vite sustituye texto, no
  hace lookup. Y el prerender corre en un sandbox Miniflare sin `process.env`. Por eso las
  variables de build se inyectan una a una vía `vite.define` en `astro.config.mjs` y se leen
  con accesos estáticos en `env.ts`. Para añadir una: en los dos sitios.
- **Con adaptador, `dist/` se parte** en `dist/client/` (estáticos) y `dist/server/` (worker).
  El directorio real lo registra la integración `registrar-salida` en `.astro/salida-build.json`
  y las auditorías lo leen de ahí — **no lo adivinan**. Adivinarlo produce un fallo muy
  reconocible: rutas con prefijo `/client/`, "no se generó sitemap-0.xml" y "robots.txt no existe",
  las tres a la vez. Si ves eso, el build y el script no coinciden.
- **`wrangler deploy` a secas dispara un auto-config** que corre `astro add cloudflare`, te toca
  `astro.config.mjs` y `.gitignore`, y lanza `npm run build`. Pásale siempre
  `--config dist/server/wrangler.json`. Ver `docs/despliegue.md`.
- Wrangler redirige `/ruta` a `/ruta/` con un **307**. Es normal y concuerda con los canonical.

### Pruebas (paso 12)
`npm run pruebas` levanta el servidor solo: construye, sirve el build y lo para al terminar.
77 pruebas en dos anchos (1440px y 360px).

- **Las rutas salen de `src/lib/nav.ts`**, la misma fuente que el menú. Añade una página al nav
  y la suite la prueba sola; no hay una segunda lista que mantener.
- Las páginas de proyecto **se descubren** del portafolio en vez de listarse, así que la suite
  funciona igual con Sanity lleno o vacío.
- Accesibilidad con axe, fallando en `critical` **y `serious`**: el contraste insuficiente cae en
  `serious`, que es justo el riesgo de esta paleta.
- Los estados del formulario se prueban interceptando `/api/cotizacion` con `page.route` (§13 lo
  llama "mockear Resend"); las reglas del endpoint se prueban contra el servidor real.

**Trampas de la suite, todas pisadas ya:**
- `reuseExistingServer` está en **false a propósito**. Aquí el servidor sirve un build, no código
  en vivo: reutilizar uno levantado hace que la suite apruebe contra un `dist/` viejo. Pasó.
- `astro preview` **se demoniza**, así que matar el proceso de Playwright no mata el servidor.
  `scripts/servidor-pruebas.mjs` lo mata por el PID de `.astro/preview.json`.
- Ese envoltorio llama a `astro preview` directo, así que el hook `prepreview` de npm NO se
  dispara: el envoltorio importa `preparar-preview.mjs` a mano. Sin eso, `.dev.vars` no llega a
  `dist/server/`, el endpoint responde 502 y la prueba del envío correcto **se salta en silencio**.
- Un `await` de una promesa que nunca resuelve no mantiene vivo a Node ("unsettled top-level
  await"): hace falta un temporizador.

### Contraste: la regla completa
El dorado es un **acento de fondo oscuro**. Sobre el negro de marca da 11:1; sobre blanco, 1.78:1,
que no llega ni al 3:1 de texto grande. Y hay **dos grises**:

| Token | Sobre | Ratio |
|---|---|---|
| `brand-gray` `#4A4A4A` | claro | 8.86:1 |
| `brand-gray-light` `#9A9A9A` | oscuro | 7.04:1 |

Intercambiarlos rompe AA y el escaneo de axe lo detecta. `/components-preview` lo muestra.

**Nombre accesible = texto visible.** No pongas un `aria-label` que sustituya el texto que se ve:
quien usa control por voz dice lo que lee. El logo lo hacía ("3BDesigns" a la vista, "EBDesing —
inicio" como nombre) y rompía WCAG 2.5.3. Para añadir contexto, mete un `<span class="sr-only">`
dentro del control en vez de un `aria-label`. La regla `label-content-name-mismatch` de axe está
**apagada por defecto**: `pruebas/accesibilidad.spec.ts` la enciende a mano.

### Lighthouse (paso 13)
`npm run lighthouse` con el preview levantado. 100 en las cuatro categorías, en Home, portafolio
y ficha de proyecto, con cero auditorías fallando por debajo.

- **SEO, accesibilidad y buenas prácticas bloquean siempre**: son propiedades del HTML y dan lo
  mismo dónde se midan.
- **El rendimiento NO bloquea contra localhost** y es orientativo: sin red real, sin CDN y —hoy—
  sin imágenes reales de Sanity, el número no representa lo que verá un visitante. Contra el
  dominio de producción (`URL_BASE=https://…`) sí bloquea.
- Un score de 100 **puede esconder auditorías fallando**: `label-content-name-mismatch` pesa 0 y
  aun así señalaba un bug real. Mira siempre la lista de auditorías, no solo el número.

### Superficie para motores de respuesta (paso 10)
`src/pages/llms.txt.ts` **genera** el archivo desde el contenido, no lo escribe a mano: las URLs
salen del dominio de `astro.config.mjs` y los servicios y proyectos de Sanity. Uno estático
empezaría a listar proyectos borrados en cuanto EBDesing editara el portafolio, y el "Done when"
del paso es justamente que cada URL listada responda 200. La suite lo comprueba.

Cada página clave abre con un párrafo de 2-3 frases que se sostiene si un motor lo cita suelto.
Hay una prueba por página que falla si alguien lo recorta a una frase.

### Despliegue (paso 14, pendiente)
Todo en **`docs/despliegue.md`**. Lo esencial:
- Despliega **GitHub Actions**, no Workers Builds: un solo dueño. Si conectas Workers Builds desde
  el panel, desconecta `.github/workflows/desplegar.yml` o habrá dos despliegues por push.
- El webhook de Sanity de §12 **no puede usar un Deploy Hook de Pages** (no existe en Workers):
  llama a `repository_dispatch` de la API de GitHub, que dispara el workflow.
- `RESEND_API_KEY` y `CONTACT_EMAIL` van como **secretos del worker** (`wrangler secret put`), no
  como `vars`: el `wrangler.json` generado declara `"vars": {}` y es la fuente de verdad en cada
  despliegue.

### Medido, no supuesto
Última verificación en navegador con throttling móvil: CLS entre 0.0007 y 0.009 en Home, Servicios,
Contacto y detalle de proyecto — el umbral "bueno" de Core Web Vitals es 0.1.
