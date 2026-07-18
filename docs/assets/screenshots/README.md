# Capturas de pantalla (staging)

Carpeta destino de las capturas del sistema para el README y la documentación.
Colocar aquí los PNG y referenciarlos desde `docs/showcase.md`.

## Capturas sugeridas y nombres

| Archivo | Qué capturar |
|---|---|
| `01-landing.png` | Página de inicio (landing) |
| `02-chat-respuesta.png` | Chat con una respuesta y **fuentes citadas** visibles |
| `03-chat-fallback.png` | Chat respondiendo honestamente que no encontró info |
| `04-admin-login.png` | Login admin (con el widget de Turnstile) |
| `05-admin-dashboard.png` | Panel admin: listado de documentos y categorías |
| `06-admin-upload.png` | Subida de documento (arrastrar y soltar) |
| `07-mobile-chat.png` | Vista móvil del chat (responsive) |

## Recomendaciones

- Resolución de escritorio: **1440×900** o **1280×800**; móvil: **390×844**.
- **Antes de subirlas, ocultar/difuminar datos sensibles**: correos reales,
  tokens, códigos TOTP, nombres de dominio privados. Usar los documentos de
  ejemplo ("Corporativo Nébula") como contenido visible.
- Formato **PNG**, nombres en minúsculas con guiones.

> Nota: estas capturas se toman manualmente desde el navegador con el staging
> levantado (`.\ops\docuagent.ps1 up`) e iniciando sesión en `/admin`. No se
> generan de forma automatizada porque el login admin requiere Turnstile + TOTP.
