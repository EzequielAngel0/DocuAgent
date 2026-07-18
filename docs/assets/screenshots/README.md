# Capturas de pantalla (producción)

Capturas de DocuAgent corriendo en producción (`docuagent.angelezequiel.dev`,
OCI + Cloudflare Tunnel). Referenciadas desde el README raíz como evidencia
del despliegue.

## Capturas y estado

| Archivo | Qué muestra | Estado |
|---|---|---|
| `01-landing.png` | Landing completa (tema oscuro) | ✅ |
| `01b-landing-stack.png` | Landing: stack tecnológico y footer | ✅ |
| `02-chat-inicio.png` | Chat: bienvenida, sugerencias y Turnstile verificado | ✅ |
| `02b-chat-respuesta.png` | Chat con respuesta y **fuentes citadas** | ⏳ pendiente |
| `03-chat-fallback.png` | Chat respondiendo que no encontró info | ⏳ opcional |
| `04-admin-login.png` | Login admin (widget de Turnstile) | ✅ |
| `04b-admin-2fa.png` | Verificación TOTP (2FA) | ✅ |
| `05-admin-dashboard.png` | Dashboard del panel admin | ✅ |
| `05b-admin-categorias.png` | CRUD de categorías | ✅ |
| `05c-admin-historial.png` | Historial/auditoría de consultas (registro de ejecución) | ✅ |
| `06-admin-documentos.png` | Gestión y subida de documentos | ✅ |
| `07-mobile-chat.png` | Vista móvil del chat (responsive) | ✅ |

## Notas

- Las del chat/landing/móvil se tomaron sobre producción; las del admin
  requieren sesión (password + Turnstile + TOTP) y se toman a mano.
- La página de login no puede automatizarse con navegador headless: Turnstile
  lo detecta y no completa el render (el anti-bot haciendo su trabajo).
- Antes de subir nuevas capturas: ocultar datos sensibles (correos reales,
  tokens, códigos TOTP visibles). El contenido visible usa la empresa
  ficticia "Corporativo Nébula".
