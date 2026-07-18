# Capturas de pantalla (staging)

Carpeta destino de las capturas del sistema para el README y la documentación.
Colocar aquí los PNG y referenciarlos desde `docs/showcase.md`.

## Capturas y estado

| Archivo | Qué muestra | Estado |
|---|---|---|
| `01-landing.png` | Página de inicio (landing) | ✅ hecha (producción) |
| `02-chat-inicio.png` | Chat: bienvenida + consultas sugeridas | ✅ hecha (producción) |
| `02b-chat-respuesta.png` | Chat con respuesta y **fuentes citadas** | ⏳ manual |
| `03-chat-fallback.png` | Chat respondiendo que no encontró info | ⏳ manual |
| `04-admin-login.png` | Login admin (widget de Turnstile) | ⏳ manual¹ |
| `05-admin-dashboard.png` | Panel admin: documentos y categorías | ⏳ manual |
| `06-admin-upload.png` | Subida de documento (drag&drop) | ⏳ manual |
| `07-mobile-chat.png` | Vista móvil del chat (responsive) | ✅ hecha (producción) |

> ¹ Las capturas automatizadas se tomaron con Chromium headless contra
> producción; la página de login no puede automatizarse porque **Turnstile
> detecta y bloquea navegadores headless** (el anti-bot haciendo su trabajo).
> Las capturas del panel admin requieren sesión (TOTP) y se toman a mano.

## Recomendaciones

- Resolución de escritorio: **1440×900** o **1280×800**; móvil: **390×844**.
- **Antes de subirlas, ocultar/difuminar datos sensibles**: correos reales,
  tokens, códigos TOTP, nombres de dominio privados. Usar los documentos de
  ejemplo ("Corporativo Nébula") como contenido visible.
- Formato **PNG**, nombres en minúsculas con guiones.

> Nota: estas capturas se toman manualmente desde el navegador con el staging
> levantado (`.\ops\docuagent.ps1 up`) e iniciando sesión en `/admin`. No se
> generan de forma automatizada porque el login admin requiere Turnstile + TOTP.
