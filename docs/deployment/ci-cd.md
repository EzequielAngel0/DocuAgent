# 🔄 CI/CD (GitHub Actions)

Dos workflows en `.github/workflows/`:

```
.github/workflows/
  ci.yml        # Lint + tests en push/PR (backend y frontend)
  deploy.yml    # Build → OCIR + deploy por SSH a OCI (en merge a main)
```

> El deploy está **gateado por la variable de repositorio `DEPLOY_ENABLED`**:
> permanece inactivo hasta crearla con valor `true`. Así, mergear a `main` antes
> de tener OCI no rompe el pipeline. Ver `docs/deployment/oci-go-live.md`.

---

## ci.yml — Validación

Se ejecuta en **push** a `develop`/`main` y en **PR** a esas ramas. Dos jobs en
paralelo; cancela ejecuciones previas del mismo ref.

### Job `backend`

Levanta servicios `postgres:16` y `qdrant:v1.10.0`, instala
`requirements-dev.txt` (Python 3.12) y corre:

- `ruff check app tests` + `ruff format --check app tests` (bloqueante).
- `mypy app` (informativo, no bloquea).
- `pytest` (unit + integration; el test de `/` no requiere servicios, pero
  están disponibles para futuras pruebas de integración).

### Job `frontend`

Node 20: `npm ci` → `npm run lint` → `npm run build` (con `NEXT_PUBLIC_*` de
producción como variables de entorno del build).

---

## deploy.yml — Build + push a OCIR y deploy SSH

Se ejecuta en **push a `main`** (cuando cambian `backend/`, `frontend/`,
`podman-compose*.yml`, `ops/` o el propio workflow) y por `workflow_dispatch`.
Ambos jobs requieren `vars.DEPLOY_ENABLED == 'true'`.

### Job `build-push` (matriz backend/frontend)

- Login a OCIR (`docker/login-action`).
- `docker/build-push-action` construye y publica
  `docuagent-<service>:latest` y `:<sha>`.
- El frontend recibe `NEXT_PUBLIC_*` como **build-args** (se inlinean en build);
  el backend los ignora.
- Caché de capas con `type=gha`.

### Job `deploy` (depende de `build-push`)

- SSH a la VM OCI (`appleboy/ssh-action`): `git pull` + `ops/docuagent.sh pull`
  + `migrate` + `up`.
- Healthcheck con reintentos contra `vars.HEALTHCHECK_URL`.

---

## Secrets y variables de GitHub

Lista completa en `docs/deployment/oci-go-live.md` (sección D). Resumen:

- **Secrets**: `OCIR_REGISTRY`, `OCIR_USER`, `OCIR_TOKEN`, `OCI_HOST`,
  `OCI_USER`, `OCI_SSH_KEY`, `OCI_APP_DIR`.
- **Variables**: `DEPLOY_ENABLED`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`,
  `NEXT_PUBLIC_APP_NAME`, `HEALTHCHECK_URL`.

---

## Flujo completo

```mermaid
flowchart LR
    PR[PR a develop] -->|ci.yml verde| DEV[Merge a develop]
    DEV -->|probado en staging local + tunnel| PR2[PR a main]
    PR2 -->|ci.yml verde| MAIN[Merge a main]
    MAIN -->|deploy.yml: build-push| OCIR[(OCIR)]
    OCIR -->|deploy.yml: SSH| OCI[Instancia OCI]
    style MAIN fill:#2ecc71,color:#fff
    style OCIR fill:#3498db,color:#fff
    style OCI fill:#e74c3c,color:#fff
```
