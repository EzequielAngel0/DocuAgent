# Aviso de Privacidad — DocuAgent

> ⚠️ **BORRADOR / PLANTILLA.** Este documento es un punto de partida generado a
> partir de los datos que el sistema realmente maneja. **No sustituye la
> asesoría de un profesional legal.** Revisa y valida antes de publicarlo.
> Completa los campos entre corchetes `[...]`.
>
> Marco de referencia asumido: **México (LFPDPPP)**. Si el público objetivo está
> en la UE u otra jurisdicción, ajusta las secciones de derechos y bases de
> tratamiento.

## Responsable del tratamiento

**[NOMBRE O RAZÓN SOCIAL DEL RESPONSABLE]**, con domicilio en
**[DOMICILIO]** y correo de contacto **[CORREO DE CONTACTO]**, es responsable
del tratamiento de sus datos personales conforme a este Aviso.

## Datos personales que recabamos

El sistema DocuAgent (en `[DOMINIO]`) trata las siguientes categorías de datos:

- **De administradores**: correo electrónico y contraseña (almacenada con hash
  bcrypt, nunca en texto plano) y el factor de autenticación TOTP. Sirven para
  el acceso al panel de administración.
- **De usuarios del chat**: el **texto de las preguntas** que escribe y las
  **respuestas** generadas, junto con las **fuentes citadas** y la
  retroalimentación (útil/no útil), se registran en una bitácora interna
  (`audit_logs`) con fines de operación y mejora del servicio.
- **Datos técnicos**: dirección **IP** (para límites de uso y protección
  anti-bot) y una **cookie de sesión** funcional (httponly) para mantener la
  sesión del administrador. No usamos cookies de publicidad ni de rastreo.

No solicitamos datos personales sensibles. **Recomendación al usuario: no
incluya datos personales o confidenciales en el texto de sus preguntas.**

## Finalidades del tratamiento

1. Responder consultas sobre la documentación interna (finalidad principal).
2. Autenticar y controlar el acceso de administradores.
3. Seguridad del servicio: prevención de abuso, límites de uso y anti-bot.
4. Mejora del servicio a partir de la retroalimentación (finalidad secundaria).

## Transferencias y encargados (terceros)

Para generar las respuestas, el **texto de su consulta y los fragmentos de
documentos relevantes** se envían a proveedores que actúan como encargados:

- **Cohere** — generación de *embeddings* y reordenamiento (rerank) del texto.
- **Google (Gemini)** — modelo de lenguaje que redacta la respuesta.
- **Cloudflare** — protección anti-bot (Turnstile), túnel y entrega de red.
- **Oracle Cloud Infrastructure (OCI)** — hospedaje de la aplicación.

Estos proveedores tratan los datos conforme a sus propias políticas. No
vendemos ni comercializamos sus datos personales.

## Conservación

Los registros de la bitácora se conservan durante **[PERIODO, p. ej. 12 meses]**,
salvo obligación legal distinta, y luego se eliminan o anonimizan.

## Derechos ARCO

Usted puede **Acceder, Rectificar, Cancelar u Oponerse** al tratamiento de sus
datos, así como revocar su consentimiento, enviando una solicitud a
**[CORREO DE CONTACTO]** con la información que permita identificarlo y el
derecho que desea ejercer. Responderemos en los plazos que marca la ley.

## Uso de cookies

Se utiliza una única **cookie de sesión funcional** (httponly, secure) necesaria
para el inicio de sesión del panel de administración. No se emplean cookies de
analítica ni publicidad.

## Cambios al Aviso

Este Aviso puede actualizarse. La versión vigente estará disponible en
**[DOMINIO]/aviso-de-privacidad**. Última actualización: **[FECHA]**.
