# Protocolo de Seguridad de la Información y Gestión de Datos

## 1. Clasificación de Datos
La información dentro de la empresa se clasifica en tres niveles:
1. **Pública:** Información destinada a difusión externa (sitio web, comunicados).
2. **Interna:** Documentación operativa de uso exclusivo para colaboradores (manuales, políticas).
3. **Confidencial / Restringida:** Código fuente, datos personales de clientes, secretos comerciales y credenciales.

## 2. Gestión de Contraseñas y Autenticación Multi-Factor (MFA)
- Es obligatorio el uso de contraseñas de al menos 12 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.
- Se requiere la activación de Autenticación de Dos Factores (**2FA/TOTP**) en todos los accesos administrativos y plataformas corporativas.
- Queda estrictamente prohibido compartir contraseñas o secrets en canales de chat sin encriptación.

## 3. Seguridad de Infraestructura y Bases de Datos
- Las bases de datos relacionales (PostgreSQL) y vectoriales (Qdrant) operan en redes virtuales privadas aisladas y no exponen puertos públicos a Internet.
- Las llaves de API y secrets de producción se almacenan y leen directamente desde almacenes seguros de secretos como OCI Vault o variables de entorno restringidas.
