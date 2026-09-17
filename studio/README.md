# Sanity Studio — EBDesing

Panel donde se edita el contenido del sitio. Es un proyecto aparte del sitio Astro:
tiene sus propias dependencias y su propio `npm install`.

## Arrancar

```bash
cd studio
cp .env.example .env     # y pon el project ID dentro
npm install
npm run dev              # http://localhost:3333
```

## Qué hay dentro

| Tipo | Qué es |
|---|---|
| **Configuración del sitio** | WhatsApp, correo, ubicación y redes. Documento único, no se puede borrar ni duplicar. |
| **Portafolio** | Un documento por proyecto. `Mostrar en la página de inicio` controla cuáles salen en la Home. |
| **Servicios** | Un documento por servicio. El campo `orden` decide en qué posición aparece. |
| **Testimonios** | Lo que dicen los clientes. |

## Publicar el panel para el cliente

```bash
npm run deploy           # queda en https://<nombre>.sanity.studio
```

Después hay que invitar por correo a la persona de EBDesing desde
sanity.io → Project → Members, para que pueda entrar a editar.

## Al publicar cambios

El sitio es estático: los cambios que se publiquen aquí no aparecen solos. Hace falta
el webhook de §12 del blueprint (Sanity → deploy hook de Cloudflare Pages) para que el
sitio se reconstruya cuando alguien publique.
