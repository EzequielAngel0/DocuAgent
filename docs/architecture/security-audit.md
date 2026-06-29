# 🔐 Análisis de Seguridad — DocuAgent

Revisión de seguridad del proyecto (backend FastAPI + agente RAG + frontend
Next.js), con hallazgos, severidad, estado y recomendaciones priorizadas.
Complementa `docs/architecture/security.md` (diseño) con el estado **real**.

> Leyenda de estado: ✅ implementado · 🟡 parcial · 🔴 pendiente.
> Severidad: 🟥 alta · 🟧 media · 🟨 baja.

## Resumen ejecutivo

El proyecto parte de una base sólida (2FA TOTP, sanitización anti-inyección,
SQL parametrizado, contenedores no-root, secretos fuera de git). En esta
revisión se **endurecieron** varios controles de API y subida de archivos. Los
riesgos residuales más relevantes son: el **token JWT en cookie legible por JS**
(robo vía XSS) y la **ausencia de rate limit en el WebSocket** (abuso/costo LLM).

## Controles endurecidos en esta revisión

| Control | Antes | Ahora | Dónde |
|---|---|---|---|
| Cabeceras de seguridad | ausentes | ✅ CSP, HSTS (prod), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | `core/middleware.py` |
| Rate limit de login/2FA | ausente | ✅ slowapi 5/15min (login), 10/15min (2FA), clave por IP real (CF-Connecting-IP) | `core/ratelimit.py`, `auth.py` |
| JWT | solo `sub`+`exp` | ✅ `iss`/`aud` emitidos y verificados | `core/security.py` |
| Secretos en producción | sin control | ✅ fail-fast si JWT/admin/Cohere/CORS inseguros o vacíos | `core/config.py` |
| Subida de archivos | extensión + tamaño | ✅ + verificación de **magic bytes** / no-binario | `core/validation.py`, `documents.py` |
| Host header | sin restricción | ✅ TrustedHostMiddleware con `ALLOWED_HOSTS` | `main.py` |
| Fugas en errores | `str(exc)` al cliente | ✅ mensaje genérico; detalle solo en logs | `chat.py`, `documents.py` |

## Análisis por área

### 1. Inyección de prompts (LLM) — 🟧
- **Estado**: 🟡 defensa en profundidad. Sanitizador regex en la entrada
  (`core/sanitizer.py`), system prompt blindado con 7 reglas NUNCA + contexto
  entre delimitadores `<contexto>`, nodo `validator` post-generación, y umbral
  de confianza que descarta contexto débil.
- **Residual**: los patrones regex son heurísticos (evasión posible); el
  validador no usa un segundo modelo. Aceptable para el caso de uso (RAG sobre
  documentos internos), pero no es una garantía fuerte.
- **Recomendación**: registrar consultas marcadas como inyección para afinar
  patrones; considerar un clasificador ligero si el riesgo crece.

### 2. Autenticación y sesión — 🟥/🟧
- **Estado**: ✅ password bcrypt, ✅ Turnstile (obligatorio en prod), ✅ TOTP 2FA,
  ✅ JWT con `iss`/`aud`, ✅ rate limit de login/2FA.
- **Residual 🟥**: el JWT se guarda en una cookie **`httponly=False`** porque el
  frontend lo lee con `document.cookie` para mandarlo en `Authorization`. Eso lo
  hace **robable por XSS**. El middleware de Next puede leer cookies `httponly`
  del lado servidor, así que la cookie NO necesita ser legible por JS.
- **Recomendación (P0)**: cookie `httponly=True` + `Secure` + `SameSite=Lax`
  solo para el guard del middleware; el cliente que necesite llamar a la API debe
  obtener el token por otro canal (respuesta de login en memoria) o usar un
  patrón BFF. Requiere refactor del frontend (varias páginas leen la cookie).
- **Residual 🟧**: TOTP sin límite de reintentos por sesión más allá del rate
  limit; sin rotación/bloqueo tras N fallos. JWT de 7 días sin refresh/rotación
  ni revocación (logout solo borra la cookie).
- **Recomendaciones (P1)**: access token corto (15 min) + refresh con rotación;
  lista de revocación o `jti`; bloqueo temporal de cuenta tras N 2FA fallidos.

### 3. API y red — 🟧
- **Estado**: ✅ CORS por allowlist (sin comodín con credenciales), ✅ cabeceras
  de seguridad, ✅ rate limit en auth, ✅ validación Pydantic estricta,
  ✅ TrustedHost en prod, ✅ red interna aislada (Postgres/Qdrant no expuestos).
- **Residual 🟧**: el **WebSocket de chat no tiene rate limit** → abuso y costo
  de LLM/Cohere. slowapi no cubre WS fácilmente.
- **Recomendaciones (P1)**: límite por IP/sesión en el WS (contador propio o
  Redis), longitud máxima de consulta (ya hay `MAX_QUERY_LEN`), y límite de
  conexiones concurrentes. Rate limit global por defecto para el resto de la API.

### 4. Subida de archivos — 🟧 → ✅
- **Estado**: ✅ allowlist de extensiones, ✅ límite de tamaño en streaming,
  ✅ verificación de magic bytes, nombre en disco generado (`doc_<uuid>`), no se
  usa el nombre del usuario para la ruta (sin path traversal).
- **Residual 🟨**: el contenido se extrae/parsea con librerías (pypdf, openpyxl,
  python-docx) que podrían tener vulnerabilidades; XLSX/DOCX son ZIP (riesgo de
  zip-bomb).
- **Recomendaciones (P2)**: límite de tamaño descomprimido al extraer; ejecutar
  la ingesta con recursos acotados; mantener dependencias actualizadas.

### 5. Datos y secretos — 🟧
- **Estado**: ✅ SQLAlchemy parametrizado (sin SQLi), ✅ Qdrant con API key,
  ✅ `.env*` fuera de git e historial limpio, ✅ fail-fast de secretos en prod.
- **Residual 🟥**: `.env.staging` contiene **llaves reales** (Cohere, Gemini,
  LangSmith, Qdrant, JWT, TOTP, túnel) en texto plano en disco. Defaults
  inseguros en `config.py` para dev.
- **Recomendaciones (P0/P1)**: **rotar** toda clave usada en staging antes de
  prod y NO reutilizarla; usar **OCI Vault** en producción; el `ADMIN_TOTP_SECRET`
  fijo del ejemplo debe regenerarse por entorno.

### 6. Contenedores e infraestructura — 🟧
- **Estado**: ✅ build multi-stage, ✅ usuario no-root, ✅ redes aisladas
  (`frontend` vs `internal`), ✅ `.dockerignore`, healthcheck real.
- **Residual 🟨**: imágenes base `python:3.12-slim`/`node:20-alpine` sin escaneo
  de vulnerabilidades en CI; sin pin por digest; sin límites de recursos en
  compose.
- **Recomendaciones (P2)**: escaneo (Trivy/Grype) en CI, `read_only` rootfs +
  `cap_drop` donde se pueda, límites de CPU/memoria, y pin por digest en prod.

### 7. Observabilidad y respuesta — 🟨
- **Estado**: ✅ structlog (JSON en prod), auditoría de consultas en `audit_logs`,
  LangSmith opcional.
- **Residual**: sin alertas ni correlación; el rate limit no emite métricas.
- **Recomendaciones (P2)**: exportar métricas (Prometheus), alertar sobre 401/429
  anómalos, y retención/anonimización de `audit_logs` (las consultas pueden traer
  datos personales — ver privacidad).

## Recomendaciones priorizadas

**P0 (antes de exponer a usuarios reales)**
1. Cookie de sesión `httponly` + `Secure` (mitiga robo de token por XSS).
2. Rotar todas las llaves de staging; usar OCI Vault en prod; no reutilizar.
3. Rate limit en el WebSocket de chat (abuso/costo).

**P1 (corto plazo)**
4. Refresh token con rotación + revocación (`jti`); bloqueo tras N 2FA fallidos.
5. Rate limit global por defecto en la API.
6. CSP del frontend (Next) además de la del backend.

**P2 (mejora continua)**
7. Escaneo de imágenes y dependencias en CI (Trivy + pip-audit/`safety`).
8. Límites de recursos y rootfs de solo lectura en contenedores.
9. Protección anti zip-bomb en la extracción de XLSX/DOCX.
10. Métricas + alertas; retención/anonimización de `audit_logs`.

## Verificación

Los controles nuevos están cubiertos por tests (`tests/unit/test_security.py`,
`test_validation.py`, `tests/integration/test_api.py::test_cabeceras_de_seguridad`)
y se ejecutan en contenedor (ver "Verificación" en `CLAUDE.md`).
