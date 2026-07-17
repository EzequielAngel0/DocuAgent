# 📋 Pendientes — qué falta para que DocuAgent esté completo

Estado vivo de lo que falta. Lo ya hecho está en `CLAUDE.md` (sección
"Pendientes y estado") y en `docs/architecture/security-audit.md`.

> **Estado al 2026-06-29**: backend + frontend funcionando **end-to-end en
> staging** (`dev.angelezequiel.dev`): chat RAG con citas (Cohere + Gemini
> `gemini-2.5-flash`), panel admin (auth httponly, CRUD, subida con drag&drop),
> ingesta e indexado reales. Falta sobre todo **producción (OCI)**, pulido y
> endurecimiento.

## 🔴 Para subir a OCI (portafolio: UNA sola VM)

> **Decisión del dueño**: es un proyecto de **portafolio**, no de negocio → se
> despliega en **una sola VM** que corre todo el compose (sin multi-VM, sin load
> balancer, sin IaC). Una instancia chica (p. ej. 1 OCPU / 6 GB) basta para este
> proyecto. Otros proyectos irán en otras VMs (1, máx. 2 por VM según peso).

- [ ] **Provisionar 1 VM** (Ubuntu 24.04) con Podman + podman-compose.
      **Plan temporal (2026-07)**: reutilizar una instancia ARM existente del
      proyecto ACP mientras dura la evaluación → guía en `DEPLOY-VM-ACP.md`
      (raíz). NO terminar/recrear instancias ARM (out of capacity).
- [x] ~~Runner adaptado a build local~~ — hecho: `DEPLOY_MODE=local` en
      `.env.prod` + `podman-compose.prod-local.yml` (build en la VM, sin OCIR).
- [ ] **GitHub**: secrets/variables + `DEPLOY_ENABLED=true` (o deploy 100% manual).
- [ ] **Cloudflare prod**: túnel + hostnames de producción.
- [ ] `.env.prod` con valores (decisión: **mismos secretos que staging**; llave
      Gemini **free-tier** se mantiene — es portafolio).
- [ ] **Respaldos** del volumen de datos (`pgdata`, `qdrant_storage`, `uploads`).

> **Ya NO aplica** (era para apps de negocio): IaC Terraform/Ansible, multi-VM,
> load balancer, OCI Vault, llave de pago. Eso simplifica bastante el go-live.

## 🟠 Seguridad

- [ ] **Refresh token con rotación + revocación** (`jti`); hoy JWT de 7 días sin refresh.
- [x] ~~Bloqueo de cuenta tras N fallos de 2FA~~ — hecho (`core/lockout.py`).
- [x] ~~Rate limit global por defecto en la API~~ — hecho (SlowAPIMiddleware).
- [x] ~~CSP propia del frontend~~ — hecho (`next.config.ts`).
- [x] ~~Escaneo en CI bloqueante~~ — hecho (Trivy bloquea en CRITICAL).
- [x] ~~Límites de CPU/memoria en compose~~ — hecho. **`read_only` del frontend: pendiente**
      (requiere `tmpfs` para `/tmp` y HOME; no se hizo para no arriesgar el arranque).

## 🟡 Producto / funcionalidad

- [x] ~~Persistencia de uploads~~ — hecho (volumen `uploads` en compose; antes se
      perdían los archivos al recrear el contenedor).
- [x] ~~Control de costo del chat público~~ — hecho: **tope global/hora** +
      **Turnstile** en el chat (flag `CHAT_REQUIRE_TURNSTILE`) + rate limit por IP.
- [x] ~~Healthcheck del frontend~~ — hecho (compose).
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
- [x] ~~Documentos de ejemplo para el seed~~ — hecho: `backend/documents/`
      (empresa ficticia "Corporativo Nébula", 4 categorías) + acción
      `./ops/docuagent.sh seed`. Falta seed de **documentos reales** de la empresa.
- [x] ~~Batería de prueba del RAG~~ — hecho: `docs/development/prueba-rag-preguntas.md`
      (10 preguntas cubriendo éxito, multilingüe, fallback, off-topic, inyección).
- [ ] **Capturas de pantalla** de staging para el README/showcase (destino en
      `docs/assets/screenshots/`; se toman a mano con el stack arriba + login).
- [ ] **Legales**: revisar y completar los borradores `docs/legal/` (aviso de
      privacidad y T&C) con razón social, contacto y jurisdicción reales.

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
