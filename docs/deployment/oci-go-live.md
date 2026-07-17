# 🚀 Go-Live en OCI — qué falta para subir a producción

Checklist accionable para desplegar DocuAgent en una instancia OCI. El código,
los Containerfiles, el compose de producción y el pipeline de despliegue ya
están listos; **falta provisionar la infraestructura y conectar los secretos**.
El paso a paso detallado de provisión está en `docs/deployment/oci-setup.md`;
esta página es la lista de verificación de alto nivel.

> Estado: **OCI sin provisionar**. El workflow `deploy.yml` está **inactivo**
> hasta crear la variable de repositorio `DEPLOY_ENABLED=true`.

> 🟢 **Despliegue de portafolio (recomendado aquí)**: una **sola VM** corre todo
> el compose (backend + frontend + postgres + qdrant + cloudflared). NO necesitas
> multi-VM, load balancer, IaC ni OCI Vault — eso es para apps de negocio. Con
> eso, las secciones A/D se simplifican mucho: provisionas 1 VM, clonas el repo,
> pones `.env.prod` y corres `./ops/docuagent.sh`. Detalle y decisiones:
> `docs/project/pendientes.md`.
>
> **Sin OCIR**: con `DEPLOY_MODE=local` en `.env.prod` el runner construye las
> imágenes en la propia VM (`podman-compose.prod-local.yml`) — las secciones
> A (OCIR) y D (GitHub Actions) dejan de ser necesarias. Guía paso a paso para
> la VM temporal del ACP: `DEPLOY-VM-ACP.md` (raíz del repo).

## A. Infraestructura OCI

- [ ] **VM** (Ubuntu 24.04, Ampere/ARM o x86) con Podman + `podman-compose`.
- [ ] **OCIR**: repositorios `docuagent-backend` y `docuagent-frontend` en el
      namespace del tenancy.
- [ ] **Auth token** de OCIR para el usuario de push (CI) y pull (VM).
- [ ] **Red**: sin ingress público directo; el tráfico entra por el túnel de
      Cloudflare (contenedor `cloudflared` del compose de prod). Abrir solo lo
      imprescindible en la security list.
- [ ] **Almacenamiento persistente** para los volúmenes `pgdata` y
      `qdrant_storage` (block volume), con respaldo.

## B. La instancia (host)

- [ ] Clonar el repo en la VM (p. ej. `/opt/docuagent`).
- [ ] Crear **`.env.prod`** a partir de `.env.example` con secretos reales
      (idealmente desde **OCI Vault**), incluyendo:
      `CORS_ALLOWED_ORIGINS=https://docuagent.angelezequiel.dev`,
      `LOG_JSON=true`, claves de Cohere/LLM, `QDRANT_API_KEY`, `JWT_SECRET_KEY`
      (64+ chars), `ADMIN_*`, Turnstile de prod y `CLOUDFLARE_TUNNEL_TOKEN`.
- [ ] `OCIR_REGISTRY` correcto en `.env.prod` (lo usa el compose de prod).
- [ ] Login a OCIR en la VM: `podman login <region>.ocir.io`.

## C. Cloudflare (producción)

- [ ] Túnel de prod con 4 hostnames → gateway del compose:
      `docuagent` y `api-docuagent`.angelezequiel.dev (detalle sensible en
      `docs/private/domain-setup.md`).
- [ ] HTTPS automático por Cloudflare.

## D. GitHub Actions (activar el deploy)

Crear en **Settings → Secrets and variables → Actions**:

**Secrets**

| Secret | Para qué |
|--------|----------|
| `OCIR_REGISTRY` | `<region>.ocir.io/<namespace>` |
| `OCIR_USER` | usuario de push (`<namespace>/<usuario>`) |
| `OCIR_TOKEN` | auth token de OCIR |
| `OCI_HOST` | IP/host de la VM |
| `OCI_USER` | usuario SSH |
| `OCI_SSH_KEY` | clave privada SSH (deploy) |
| `OCI_APP_DIR` | ruta del repo en la VM (`/opt/docuagent`) |

**Variables**

| Variable | Valor |
|----------|-------|
| `DEPLOY_ENABLED` | `true` (activa los jobs de deploy) |
| `NEXT_PUBLIC_API_URL` | `https://api-docuagent.angelezequiel.dev/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `wss://api-docuagent.angelezequiel.dev/api/v1/chat/ws` |
| `NEXT_PUBLIC_APP_NAME` | `DocuAgent` |
| `HEALTHCHECK_URL` | `https://api-docuagent.angelezequiel.dev/api/v1/health` |

## E. Primer despliegue

1. **Automático**: merge a `main` → `deploy.yml` construye y publica las
   imágenes en OCIR y ejecuta por SSH `pull → migrate → up` en la VM.
2. **Manual** (alternativa, en la VM):
   ```bash
   ./ops/docuagent.sh pull
   ./ops/docuagent.sh migrate
   ./ops/docuagent.sh up
   ```

## F. Verificación post-deploy

- [ ] `curl -f https://api-docuagent.angelezequiel.dev/api/v1/health` → 200.
- [ ] `/api/v1/health/ready` → `database` y `qdrant` en `ok`.
- [ ] Frontend en `https://docuagent.angelezequiel.dev` carga.
- [ ] Login admin (TOTP) + carga de un documento + consulta en el chat.
- [ ] Logs en JSON (`LOG_JSON=true`) y túnel estable.

## G. Endurecimiento (antes de tráfico real)

- [ ] Rotar **todas** las claves que se usaron en staging (no reutilizar).
- [ ] Contenedores no-root (ya en los Containerfiles) y redes aisladas
      (`frontend` vs `internal`, ya en el compose).
- [ ] Implementar lo **pendiente** de seguridad: rate limiting, security headers
      (CSP/HSTS/X-Frame), verificación de uploads por magic bytes.
- [ ] Respaldos automáticos de Postgres y snapshots del block volume.
- [ ] Observabilidad: LangSmith activo y revisión de logs.

Detalle de provisión paso a paso: `docs/deployment/oci-setup.md`.
Pipeline: `docs/deployment/ci-cd.md`.
