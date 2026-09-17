# Despliegue

## Workers, no Pages

El blueprint §12 dice "Cloudflare Pages", pero `@astrojs/cloudflare` 14.x genera un
`wrangler.json` de **Cloudflare Workers con Static Assets** (`assets.directory: ../client`).
Se mantiene Workers: es lo que el adaptador hace y cambiarlo significaría cambiar de adaptador.

Consecuencia práctica: **el "Deploy Hook" de Pages que menciona §12 no existe aquí**, así que el
webhook de Sanity va por otro camino (más abajo).

## Quién despliega

**GitHub Actions**, no la integración git de Cloudflare (Workers Builds). Un solo dueño del
despliegue: con las dos conectadas, cada push dispararía dos builds compitiendo por publicar la
misma versión.

`.github/workflows/desplegar.yml` se dispara con:

| Disparador | Cuándo |
|---|---|
| `push` a `main` | cambios de código |
| `repository_dispatch` tipo `sanity-publicado` | alguien publica contenido en Sanity |
| `workflow_dispatch` | botón manual en la pestaña Actions |

> Si en algún momento conectas Workers Builds desde el panel de Cloudflare, **desconecta este
> workflow** o tendrás dos despliegues por cada push.

## ⚠ Nunca ejecutes `wrangler deploy` a secas

**Siempre con `--config dist/server/wrangler.json`.**

Sin esa bandera, wrangler no encuentra configuración en la raíz y arranca su
*auto-config*: te pregunta "Proceed with setup?", y si dices que sí **modifica el
repositorio**. Concretamente:

- corre `npx astro add cloudflare`, que reescribe `astro.config.mjs` para añadir el adaptador;
- instala `wrangler` como dependencia;
- edita tu `.gitignore`;
- y después lanza `npm run build` como "custom build".

Pasó de verdad: en un repositorio que iba retrasado respecto a `main` y todavía no tenía el
adaptador, el auto-config se lo añadió. La salida pasó de ser plana (`dist/`) a estar partida
(`dist/client/` y `dist/server/`), y la auditoría de esa copia antigua —que daba por hecho salida
plana— reventó con catorce errores inventados: rutas con prefijo `/client/`, "no se generó
sitemap-0.xml" y "robots.txt no existe". El sitio estaba bien; el script era viejo.

Dos defensas desde entonces:

1. El directorio del build **ya no se adivina**: la integración `registrar-salida` lo escribe en
   `.astro/salida-build.json` y las auditorías lo leen de ahí. Si ese archivo falta, avisan en
   voz alta antes de reportar nada.
2. El workflow de despliegue siempre pasa `--config`, así que nunca dispara el auto-config.

Si alguna vez ves ese diálogo de setup, **responde que no** y revisa `git status`: puede haberte
cambiado `astro.config.mjs` y `.gitignore`.

## Configuración que hay que hacer una vez

### 1. En GitHub → Settings → Secrets and variables → Actions

**Variables** (pestaña *Variables*, no son secretos):

| Nombre | Valor |
|---|---|
| `SANITY_PROJECT_ID` | el project id de Sanity |
| `SANITY_DATASET` | `production` |
| `SANITY_API_VERSION` | `2026-09-17` |

**Secretos** (pestaña *Secrets*):

| Nombre | Dónde sacarlo |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens, plantilla "Edit Cloudflare Workers" |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Workers & Pages, columna derecha |

### 2. Secretos del worker (Resend)

`RESEND_API_KEY` y `CONTACT_EMAIL` son variables de **runtime del worker**, no del build. No se
pasan desde el workflow: se ponen una sola vez y quedan guardadas en Cloudflare.

```bash
npm run build                                    # genera dist/server/wrangler.json
npx wrangler secret put RESEND_API_KEY  --config dist/server/wrangler.json
npx wrangler secret put CONTACT_EMAIL   --config dist/server/wrangler.json
```

⚠ **Ponlos como secretos, no como variables de texto plano en el panel.** El `wrangler.json` que
genera el adaptador declara `"vars": {}`, y ese archivo es la fuente de verdad de las `vars` en cada
despliegue. Los secretos se gestionan aparte y no aparecen en la configuración, así que un
despliegue no los toca.

### 3. Webhook de Sanity → GitHub

Esto sustituye al "Deploy Hook de Cloudflare Pages" de §12. Sanity llama a la API de GitHub, que
dispara el workflow, que reconstruye y despliega.

Necesitas un **token personal de GitHub** (Settings → Developer settings → Personal access tokens)
con permiso de escritura en *Contents* de este repositorio.

En **Sanity → Settings → API → Webhooks → Create webhook**:

| Campo | Valor |
|---|---|
| Name | Reconstruir el sitio |
| URL | `https://api.github.com/repos/Byrondh1/ebdesing/dispatches` |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["proyecto", "servicio", "testimonio", "configuracionSitio"]` |
| Projection | `{"event_type": "sanity-publicado"}` |
| HTTP method | POST |
| HTTP headers | `Authorization: Bearer <tu token>`<br>`Accept: application/vnd.github+json`<br>`X-GitHub-Api-Version: 2022-11-28` |

El `Filter` evita reconstruir por borradores o por tipos que no afectan al sitio. El `Projection`
es lo que convierte el evento de Sanity en el cuerpo que espera la API de GitHub.

**Para comprobar que funciona:** publica un cambio cualquiera en el Studio y mira la pestaña
*Actions* del repositorio. Debe aparecer una ejecución con el disparador `repository_dispatch`.

## Antes del primer despliegue

```bash
npm run marcadores    # bloqueantes que siguen abiertos
npm run typecheck
npm run pruebas
npm run build
```

Y con el sitio ya publicado, contra el dominio real:

```bash
URL_BASE=https://<dominio> npm run lighthouse
```

Contra el dominio de producción el rendimiento **sí** bloquea; contra localhost no, porque sin red
real ni CDN el número no representa nada.
