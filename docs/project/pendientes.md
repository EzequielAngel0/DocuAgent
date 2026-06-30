# 📋 Pendientes — qué falta para que DocuAgent esté completo

Estado vivo de lo que falta. Lo ya hecho está en `CLAUDE.md` (sección
"Pendientes y estado") y en `docs/architecture/security-audit.md`.

> **Estado al 2026-06-29**: backend + frontend funcionando **end-to-end en
> staging** (`dev.angelezequiel.dev`): chat RAG con citas (Cohere + Gemini
> `gemini-2.5-flash`), panel admin (auth httponly, CRUD, subida con drag&drop),
> ingesta e indexado reales. Falta sobre todo **producción (OCI)**, pulido y
> endurecimiento.

## 🔴 Bloqueante para producción (OCI)

- [ ] **Provisionar OCI**: VM Ubuntu + OCIR + red + block volume (no existe nada).
- [ ] **IaC**: no hay Terraform/Ansible; hoy la provisión es manual
      (`docs/deployment/oci-setup.md`).
- [ ] **GitHub**: crear secrets/variables y `DEPLOY_ENABLED=true`
      (`docs/deployment/oci-go-live.md`).
- [ ] **Cloudflare prod**: túnel + 4 hostnames de producción.
- [ ] **Llaves**: rotar las de staging; usar **OCI Vault**; conseguir una key de
      **Gemini con cuota de pago** (la free tier limita a modelos concretos).

## 🟠 Seguridad

- [ ] **Refresh token con rotación + revocación** (`jti`); hoy JWT de 7 días sin refresh.
- [x] ~~Bloqueo de cuenta tras N fallos de 2FA~~ — hecho (`core/lockout.py`).
- [x] ~~Rate limit global por defecto en la API~~ — hecho (SlowAPIMiddleware).
- [x] ~~CSP propia del frontend~~ — hecho (`next.config.ts`).
- [x] ~~Escaneo en CI bloqueante~~ — hecho (Trivy bloquea en CRITICAL).
- [x] ~~Límites de CPU/memoria en compose~~ — hecho. **`read_only` del frontend: pendiente**
      (requiere `tmpfs` para `/tmp` y HOME; no se hizo para no arriesgar el arranque).

## 🟡 Producto / funcionalidad

- [ ] **Historial de chat por usuario en backend**: hoy las conversaciones del
      chat viven solo en `localStorage` del navegador (el backend solo guarda
      `audit_logs` por consulta). Falta tabla de sesiones/mensajes si se quiere
      historial real multi-dispositivo.
- [ ] **Detección de idioma** real en chunks (hoy no se detecta; multilingüe
      es/en/pt soportado por embeddings pero no se etiqueta).
- [x] ~~Re-generación en el grafo~~ — hecho (reintenta 1 vez ante respuesta vacía
      antes de caer al fallback; guarda anti-bucle).
- [~] **Página `setup-2fa`**: se deja **así por diseño** — el TOTP se siembra por
      `.env`, evitando una superficie de ataque extra (decisión del dueño).
- [ ] Seed de **documentos reales** de la empresa.

## 🟢 Calidad / DX / frontend

- [x] ~~Tests de frontend~~ — setup base con **Vitest** + tests de `lib/api`
      (queda ampliar cobertura a componentes con Testing Library).
- [x] Tests backend ampliados (lockout, re-generación; 68 en verde). Falta
      integración real con Postgres/Qdrant y e2e del chat.
- [ ] `mypy` estricto y bloqueante (hoy informativo en CI).
- [ ] **Refactor frontend** a capa `hooks/ + types/` (hoy solo `lib/api.ts`; el
      resto de la lógica vive inline en cada `page.tsx`).
- [ ] **Rediseño visual** más profundo del panel admin si se desea (hoy
      funcional + arreglos puntuales: drag&drop, modales/avisos custom, etc.).
- [ ] QA responsive (mobile/tablet) end-to-end.

## ✅ Hecho recientemente (para contexto)

- Arquitectura completa (LangGraph, providers con fallback, rag/ingestion/core).
- Staging levantado y **validado end-to-end** en `dev.angelezequiel.dev`.
- Chat RAG funcionando (fix del modelo Gemini + cuota; LangSmith apagado).
- Auth admin con **cookie httponly** (sin token en JS) + `credentials:include`.
- Seguridad: headers, rate limit login/2FA/WS, JWT iss/aud, magic bytes,
  anti zip-bomb, fail-fast de secretos, hardening de contenedores, CI con scanning.
- Frontend: drag&drop real, diálogos/avisos personalizados (sin nativos), modal
  centrado, pluralización, Enter para enviar, globo de respuesta corregido.
