# EBDesing — Sitio Web — Blueprint

> Self-contained. Un Claude Code fresco, sin contexto previo, debe poder construir esto siguiendo
> únicamente este documento, sin hacer preguntas.

Generado: 2026-09-17
Shape: `marketing-site` (portafolio + captación de leads)

---

## 1. Overview & Non-Goals

**Qué es:** sitio institucional para EBDesing, agencia de diseño y publicidad en Ecuador. Objetivo
de negocio: presencia en Google + credibilidad de marca, y conversión de visitantes en cotizaciones
(formulario) o contacto directo (WhatsApp).

**Qué NO es v1:**
- Sin cuentas de usuario / login
- Sin pagos en línea
- Sin blog (decisión explícita: el equipo no publicará semanal/diariamente; un blog abandonado
  perjudica el SEO más de lo que ayuda. Se puede añadir después sin migración costosa — la
  estructura de contenido en Sanity ya lo soporta)
- Sin multi-idioma (solo español; Ecuador es el mercado)
- Sin backend propio más allá de un único endpoint (formulario de cotización)

**Audiencia:** clientes potenciales en Ecuador buscando servicios de diseño/publicidad. ~100
visitas/mes esperadas al lanzar. Llegan por: búsqueda en Google y link compartido en redes sociales.

**Quién edita después del lanzamiento:** una persona de EBDesing, no técnica — vía panel de Sanity
Studio (no toca código).

**Marca:** logo "3B Designs — Agencia de Diseño y Publicidad". Paleta: dorado/amarillo vibrante
(`#F5B800` aprox.), negro (`#0A0A0A`), blanco. Tipografía sugerida: sans bold/condensada de alto
contraste, tono "racing"/energético (ver §7).

---

## 2. Tech Stack

Todas las versiones verificadas contra `registry.npmjs.org` el 2026-09-17. Fuente: `npm view <pkg> version`.

| Capa | Paquete | Versión | Notas |
|---|---|---|---|
| Runtime | Node.js | `>=22.12.0` | Requerido por Astro 7.x |
| Framework | `astro` | **7.3.3** | Static-first, islands |
| Adaptador deploy | `@astrojs/cloudflare` | **14.3.2** | SSR mínimo para el endpoint del formulario |
| Estilos | `tailwindcss` | **4.3.3** | CSS-first config (`@import "tailwindcss"` en CSS, no `tailwind.config.js` clásico) |
| Integración Tailwind↔Vite | `@tailwindcss/vite` | **4.3.3** | Usar este, NO `@astrojs/tailwind` (ese es para Tailwind 3) |
| CMS | `sanity` (Studio) | **6.15.0** | Se instala como app separada embebida en `/studio` |
| Cliente Sanity | `@sanity/client` | **8.6.2** | Fetch de contenido desde Astro |
| Integración Sanity↔Astro | `@sanity/astro` | **3.5.1** | Opcional; si da conflicto de peer deps, usar `@sanity/client` directo (más simple, menos mágico) |
| Email transaccional | `resend` | **6.28.1** | Envío del lead del formulario |
| CLI Cloudflare | `wrangler` | **4.134.0** | Deploy y preview local |
| Lenguaje | `typescript` | **7.0.2** — usar **`~6.0.3` si `7.0.2` da fricción**, ver Gotchas | Astro trae su propio tsconfig base |

**No usar ORM ni base de datos propia.** El contenido vive en Sanity (su propia infraestructura); el
lead del formulario es write-only (se manda por email, no se guarda en ninguna tabla propia — así se
evita toda la capa de base de datos/hosting de datos).

### Gotchas de versión

- `typescript@7.0.2` es la reescritura nativa en Go, GA reciente — más rápida pero sin API estable
  de compilador para algunas herramientas. Si algún integration da error raro de tipos, bajar a
  `typescript@~6.0.3` (estable, probado).
- Tailwind 4 es CSS-first: NO se usa `tailwind.config.js` con `content: [...]` como en v3. Los
  tokens de marca van en el propio CSS con `@theme`. Ver §7.
- `@astrojs/tailwind` es el paquete viejo (Tailwind 3). Con Tailwind 4 se usa `@tailwindcss/vite`
  directo en `astro.config.mjs`. No mezclar los dos.

---

## 3. Directory Structure

```
ebdesing-web/
  src/
    pages/
      index.astro          # Home
      servicios.astro      # Servicios
      portafolio.astro     # Listado de proyectos (desde Sanity)
      portafolio/[slug].astro  # Detalle de proyecto
      sobre-nosotros.astro
      contacto.astro       # Formulario de cotización
      404.astro
      api/
        cotizacion.ts      # POST endpoint — único punto server-side
    layouts/
      Base.astro           # head/meta/OG/canonical, fonts, header, footer
    components/
      sections/
        Hero.astro
        Servicios.astro
        Proyectos.astro    # preview de portafolio en Home
        CTA.astro
        FAQ.astro
      ui/
        Button.astro
        Card.astro
        Badge.astro
      islands/
        FormularioCotizacion.tsx   # único componente hidratado (client:load)
        BotonWhatsApp.astro        # link estático, sin JS — no es isla
    lib/
      sanity.ts           # cliente Sanity configurado
      seo.ts              # helpers de metadata/JSON-LD
      email.ts            # cliente Resend
    styles/
      global.css          # @import "tailwindcss"; @theme { tokens de marca }
  public/
    favicon.svg
    og-default.png
    robots.txt
    llms.txt
  studio/                  # Sanity Studio embebido, proyecto separado
    sanity.config.ts
    schemaTypes/
      servicio.ts
      proyecto.ts          # portafolio item
      testimonio.ts
  astro.config.mjs
  package.json
  tsconfig.json
  .env.example
```

---

## 4. Data Model (Sanity schemas)

No hay base de datos propia. Estos son los **document types** de Sanity Studio.

| Entidad | Campos | Notas |
|---|---|---|
| `proyecto` (portafolio) | `titulo`, `slug`, `cliente`, `categoria` (diseño/publicidad/branding), `imagenPrincipal`, `galeria[]`, `descripcion`, `resultado` (texto libre — el "después"), `destacado` (bool), `orden` (int) | `destacado` controla qué aparece en Home |
| `servicio` | `titulo`, `slug`, `icono`, `descripcionCorta`, `descripcionCompleta`, `orden` | Una entrada por servicio ofrecido |
| `testimonio` | `nombreCliente`, `empresa`, `cita`, `foto` (opcional) | Para la sección de prueba social |
| `configuracionSitio` (singleton) | `telefonoWhatsapp`, `emailContacto`, `direccion`, `redesSociales{instagram, facebook, tiktok}` | Un solo documento; evita hardcodear datos de contacto en el código |

**Lead del formulario:** NO es un documento de Sanity. El endpoint `/api/cotizacion` recibe el POST,
valida, y lo envía por email vía Resend directo al correo de EBDesing. Write-only, sin
almacenamiento propio — el inbox de correo es la fuente de verdad, como indica el shape de
marketing-site para este caso.

---

## 5. API Design

**Un solo endpoint server-side**, en `src/pages/api/cotizacion.ts` (requiere el adaptador SSR de
Cloudflare para esa ruta; el resto del sitio se sirve estático).

```
POST /api/cotizacion
Body (JSON): { nombre, email, telefono, servicioInteres, mensaje, honeypot }
```

- WHEN el body pasa validación (zod: nombre y email requeridos, email con formato válido, honeypot
  vacío) THE SYSTEM SHALL enviar el email vía Resend al correo de EBDesing y responder `200 {ok:true}`.
- WHEN el honeypot viene relleno (bot) THE SYSTEM SHALL responder `200 {ok:true}` sin enviar email
  (falso positivo silencioso, no le decimos al bot que falló).
- WHEN falta un campo requerido o el email es inválido THE SYSTEM SHALL responder `400` con el
  detalle del campo — y el cliente (isla del formulario) nunca deja llegar esa petición: valida
  inline antes de hacer el POST.
- WHEN Resend falla (caído, cuota) THE SYSTEM SHALL responder `502` y el formulario mostrar un
  mensaje con el número de WhatsApp como alternativa.

No hay más rutas API. El botón de WhatsApp es un link estático `https://wa.me/<numero>?text=<mensaje
prellenado>` — cero backend.

---

## 6. Frontend Architecture

- **Astro islands**, hidratación mínima. Único componente interactivo: el formulario de cotización
  (`client:load` en React o Astro con `<script>` vanilla — se recomienda un componente Astro con
  `<script>` inline en vez de traer React solo para un form; menos JS enviado).
- Todo lo demás (hero, servicios, portafolio, footer) es HTML estático generado en build time,
  con el contenido leído de Sanity vía `getStaticPaths`/fetch en build.
- **Revalidación de contenido:** como el portafolio vive en Sanity y el sitio es estático, hay que
  decidir cómo se refresca tras editar en Sanity Studio:
  - Opción simple (recomendada para v1): rebuild manual/trigger de deploy en Cloudflare cada vez
    que EBDesing publica cambios (un botón "Publicar" en un pequeño webhook de Sanity → Cloudflare
    Pages deploy hook). Se documenta en §12.
  - Alternativa: ISR/on-demand rendering — más complejo, no necesario con ~100 visitas/mes y
    cambios de contenido poco frecuentes.

---

## 7. Design System

Tokens extraídos del logo (`3B Designs`). Definidos en Tailwind 4 CSS-first (`src/styles/global.css`):

```css
@import "tailwindcss";

@theme {
  --color-brand-yellow: #F5B800;
  --color-brand-yellow-dark: #D9A300;
  --color-brand-black: #0A0A0A;
  --color-brand-white: #FFFFFF;
  --color-brand-gray: #4A4A4A;

  --font-display: "Archivo Black", "Oswald", sans-serif; /* bold, condensada — tono racing */
  --font-body: "Inter", sans-serif;
}
```

- **Contraste alto**, bloques negros con acentos amarillos, tipografía de titulares condensada/bold
  (evocando el logo). Mobile-first: diseñar en 360px, adaptar a 1440px después.
- Dark mode: no es prioridad para v1 (marca ya es de alto contraste sobre blanco); omitir salvo que
  el usuario lo pida.
- Botones primarios: fondo amarillo, texto negro, alto contraste, hover a `--color-brand-yellow-dark`.
- Botón de WhatsApp: flotante, esquina inferior derecha, ícono reconocible, siempre visible en scroll.

---

## 8. Authentication & Authorization

No aplica — sin cuentas de usuario en v1. Sanity Studio tiene su propio login (gestionado por
Sanity, se invita al usuario no técnico de EBDesing como colaborador del proyecto Sanity).

---

## 9. BUILD ORDER

Cada paso cabe en una sesión. Formato *Done when* + comando de verificación.

**1. Scaffold + tokens**
`npm create astro@latest ebdesing-web -- --template minimal --typescript strict`, luego añadir
Tailwind 4 (`npm install tailwindcss @tailwindcss/vite`, configurar en `astro.config.mjs`), definir
tokens de §7 en `global.css`.
*Done when:* `npm run dev` renderiza una página en blanco usando solo colores de `--color-brand-*`,
y `npm run build` sale con código 0.

**2. Layout base**
`Base.astro` con head/meta/OG/canonical como props, header (logo + nav) y footer (redes,
contacto) leyendo de un `NavItem[]` único.
*Done when:* `view-source` en cualquier ruta muestra un `<title>` único y un
`<link rel="canonical">`.

**3. Sistema de diseño**
Button, Card, Badge con los tokens de marca. Página `/components-preview` (temporal, se borra antes
de deploy) que renderiza todos los primitivos.
*Done when:* esa página muestra cada componente sin nada sin estilo.

**4. Home — sección por sección** (Hero, Servicios destacados, Proyectos destacados, Testimonios,
CTA final) — dos secciones por sesión, nunca las seis de golpe.
*Done when:* la página renderiza en 360px y 1440px sin scroll horizontal ni layout shift al cargar.

**5. Páginas internas** (Servicios, Sobre nosotros, 404 personalizado).
*Done when:* cada link del nav resuelve a 200 y `/ruta-inexistente` devuelve status 404 real.

**6. Integración Sanity — setup**
Crear proyecto en Sanity, `studio/` con los schemas de §4, cliente en `src/lib/sanity.ts`.
*Done when:* `sanity dev` (dentro de `studio/`) levanta el Studio localmente y se puede crear un
documento `proyecto` de prueba.

**7. Portafolio — listado + detalle**
`/portafolio` lista todos los `proyecto`, `/portafolio/[slug]` genera una página por proyecto vía
`getStaticPaths` leyendo de Sanity.
*Done when:* crear un `proyecto` nuevo en Sanity y correr `npm run build` genera una página nueva en
`/portafolio/<slug>` con título y descripción únicos.

**8. Formulario de cotización + WhatsApp**
Isla del formulario con validación inline y honeypot; endpoint `/api/cotizacion.ts` con Resend;
botón flotante de WhatsApp con `configuracionSitio.telefonoWhatsapp` desde Sanity.
*Done when:* una petición POST válida devuelve éxito, llega el email, y el formulario muestra estado
de éxito; un campo requerido vacío nunca llega a hacer la petición de red (verificable en devtools).

**9. SEO**
`sitemap.xml`, `robots.txt`, JSON-LD (`Organization`, `WebSite`, y `Product`/`Service` por página de
servicio), OG image por página (no una sola genérica).
*Done when:* un script de auditoría sobre cada ruta reporta cero títulos faltantes, cero
descripciones duplicadas, cero canonical mal formados.

**10. Superficie de answer-engines**
`llms.txt` en la raíz del sitio, párrafo inicial de 2-3 frases citable en cada página clave.
*Done when:* `llms.txt` responde 200 y cada URL que lista también responde 200.

**11. Imágenes y fuentes**
Formatos modernos (webp/avif), `width`/`height` explícitos, fuentes autoalojadas con preload.
*Done when:* ninguna imagen enviada supera 200KB y no hay peticiones a fuentes de terceros en el
panel de red.

**12. Accesibilidad + pruebas**
Navegación por teclado en nav y formulario, chequeo de contraste, prueba E2E que visita cada ruta.
*Done when:* el escaneo de accesibilidad no reporta issues críticos y la suite E2E pasa en todas las
rutas.

**13. Performance**
Medir en perfil móvil con throttling.
*Done when:* Lighthouse reporta ≥95 en Performance y SEO tanto en Home como en una página de
portafolio.

**14. Deploy**
Cloudflare Pages, dominio propio, redirects si aplica, analytics.
*Done when:* una petición al dominio de producción devuelve 200 sobre HTTPS con certificado válido,
y un navegador headless cargando la Home registra al menos una petición saliente al colector de
analytics con respuesta 2xx.

---

## 10. Environment Setup

`.env.example`:
```
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_VERSION=2026-09-17
RESEND_API_KEY=
CONTACT_EMAIL=
```

Comandos de arranque:
```bash
npm install
npm run dev          # sitio Astro, localhost:4321
cd studio && npm install && npm run dev   # Sanity Studio, localhost:3333
```

---

## 11. Dependencies — package.json (raíz del sitio)

```json
{
  "dependencies": {
    "astro": "7.3.3",
    "@astrojs/cloudflare": "14.3.2",
    "@sanity/client": "8.6.2",
    "resend": "6.28.1",
    "tailwindcss": "4.3.3",
    "@tailwindcss/vite": "4.3.3"
  },
  "devDependencies": {
    "typescript": "~6.0.3",
    "wrangler": "4.134.0"
  }
}
```
Nota: se fija `typescript` en `~6.0.3` (no `7.0.2`) por estabilidad de tooling — ver Gotchas en §2.

---

## 12. Deployment Strategy

- **Host:** Cloudflare Pages, conectado al repo de GitHub — cada push a `main` despliega, cada PR
  genera preview URL.
- **Adaptador SSR:** solo la ruta `/api/cotizacion` necesita ejecución server-side; el resto se
  sirve estático desde el edge.
- **Rebuild al editar contenido:** configurar un webhook en Sanity (`Settings → API → Webhooks`) que
  llama al Deploy Hook de Cloudflare Pages cuando se publica un documento — así el sitio se
  reconstruye solo cuando EBDesing edita el portafolio, sin que Byron tenga que redeployar a mano.
- **Dominio:** conectar el dominio propio de EBDesing en Cloudflare Pages (DNS ya en Cloudflare o
  vía CNAME si está en otro proveedor).

---

## 13. Testing Strategy

- **Smoke E2E** (Playwright): visita cada ruta del nav, verifica 200, verifica que el formulario
  rechaza un submit vacío y acepta uno válido (mockeando Resend en el test).
- **Auditoría de metadata:** script que recorre las rutas generadas y falla el build si falta
  `title`, `description` o `canonical`.
- No se requiere test unitario extenso — es un sitio de contenido, no lógica de negocio compleja.

---

## 14. Security & Secrets

- `RESEND_API_KEY` y `SANITY_PROJECT_ID`/dataset como variables de entorno en Cloudflare Pages, NUNCA
  hardcodeadas ni commiteadas.
- Honeypot + validación server-side en el endpoint (nunca confiar solo en la validación del cliente).
- Sanity Studio: acceso restringido a los colaboradores invitados por email (Byron + persona de
  EBDesing), no público.

---

## 15. Accessibility

- Contraste AA mínimo en todo texto sobre fondo negro/amarillo (verificar el amarillo `#F5B800`
  sobre negro cumple AA para texto grande; para texto pequeño usar negro sobre amarillo, no blanco
  sobre amarillo).
- Formulario: labels asociados, mensajes de error anunciados, foco visible.
- Nav completamente operable por teclado.

---

## 16. Observability & Cost

- **Analytics:** uno que preserve privacidad y no requiera banner de cookies (ej. Cloudflare Web
  Analytics, gratis e incluido con Cloudflare Pages — cero configuración extra de consentimiento).
- **Costo mensual estimado v1:** $0 — Cloudflare Pages (plan gratis cubre este tráfico), Sanity
  (plan gratis cubre 1 usuario + este volumen de contenido), Resend (plan gratis cubre el volumen de
  leads esperado). Único costo real: el dominio.

---

## 17. Skills para la fase de construcción

(Instrucciones para el Claude Code que construya esto, no para el arquitecto)

| Skill | Cuándo |
|---|---|
| `frontend-design` | Cada sección de los pasos 4-5 |
| `/humanizalo` | Todos los textos de marketing (servicios, sobre nosotros, descripciones de proyectos) |

---

## 18. CLAUDE.md (para la raíz del proyecto)

```markdown
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
```

---

## 19. Acceptance Gate & Decision Log

| Decisión | Resuelta como | Razón |
|---|---|---|
| Framework | Astro, no Next.js | Sitio de marketing puro, no comparte componentes con otra app; Astro envía cero JS por defecto |
| CMS | Sí, Sanity | El editor de contenido no es técnico |
| Blog | No en v1 | El equipo no publicará con regularidad; blog abandonado daña el SEO más de lo que ayuda |
| Base de datos propia | No | El único dato dinámico (lead del form) es write-only vía email |
| Idiomas | Solo español | Mercado objetivo es Ecuador |
| Autenticación | No aplica | Sin cuentas de usuario en el sitio público |

**Cero markers `[NEEDS CLARIFICATION]` abiertos.**

---

## Siguiente paso

1. Copia este archivo a la raíz de un repo nuevo como `ebdesing-blueprint.md`.
2. Copia el bloque de §18 a un archivo `CLAUDE.md` en esa misma raíz.
3. Abre una sesión de Claude Code **en esa carpeta** y dile: *"Sigue el blueprint, empieza por el
   paso 1 del Build Order."*

**Nota de honestidad:** este blueprint no fue probado en vivo (no se corrió el scaffold real ni el
build) — las versiones sí están verificadas contra el registro de npm en el momento de generarlo,
pero el primer `npm install` es la primera vez que esta combinación exacta se ejecuta. Si algo falla
en el paso 1, es casi siempre un peer-dependency de Tailwind 4 o Astro 7 — revisa el mensaje de error
contra la tabla de §2 antes de cambiar versiones a ciegas.
