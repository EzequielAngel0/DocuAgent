# 🔄 CI/CD (GitHub Actions)

## Workflows

```
.github/workflows/
  ci.yml              # Validación en cada push/PR
  images.yml          # Build + push a OCIR al mergear a main
  deploy-prod.yml     # Deploy manual a OCI
```

---

## ci.yml — Validación

Se ejecuta en **cada push** a cualquier branch y en **cada PR** a `develop` o `main`.

```yaml
name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: docuagent_test
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
      qdrant:
        image: qdrant/qdrant:v1.10.0
        ports: ["6333:6333"]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install dependencies
        run: |
          cd backend
          pip install -e ".[dev]"

      - name: Lint
        run: |
          cd backend
          ruff check app/

      - name: Type check
        run: |
          cd backend
          mypy app/

      - name: Unit tests
        run: |
          cd backend
          pytest tests/unit/ -v

      - name: Integration tests
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/docuagent_test
          QDRANT_HOST: localhost
          QDRANT_PORT: 6333
        run: |
          cd backend
          pytest tests/integration/ -v

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install
        run: cd frontend && npm ci

      - name: Lint
        run: cd frontend && npm run lint

      - name: Build
        run: cd frontend && npm run build
```

---

## images.yml — Build + Push a OCIR

Se ejecuta al **mergear a `main`** cuando cambian archivos de backend o frontend.

```yaml
name: Build Images

on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - "frontend/**"

jobs:
  build-push:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [backend, frontend]

    steps:
      - uses: actions/checkout@v4

      - name: Login to OCIR
        run: |
          echo "${{ secrets.OCIR_TOKEN }}" | \
          podman login ${{ secrets.OCIR_REGISTRY }} \
            -u "${{ secrets.OCIR_USER }}" --password-stdin

      - name: Build image
        run: |
          podman build \
            -f ${{ matrix.service }}/Containerfile \
            -t ${{ secrets.OCIR_REGISTRY }}/docuagent-${{ matrix.service }}:latest \
            -t ${{ secrets.OCIR_REGISTRY }}/docuagent-${{ matrix.service }}:${{ github.sha }} \
            ${{ matrix.service }}/

      - name: Push image
        run: |
          podman push ${{ secrets.OCIR_REGISTRY }}/docuagent-${{ matrix.service }}:latest
          podman push ${{ secrets.OCIR_REGISTRY }}/docuagent-${{ matrix.service }}:${{ github.sha }}
```

---

## deploy-prod.yml — Deploy manual

Trigger **manual** (workflow_dispatch) para controlar cuándo se despliega.

```yaml
name: Deploy PROD

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: [self-hosted, oci-prod]
    steps:
      - uses: actions/checkout@v4

      - name: Pull latest images
        run: ./ops/docuagent.sh pull

      - name: Run migrations
        run: ./ops/docuagent.sh migrate

      - name: Deploy
        run: ./ops/docuagent.sh restart

      - name: Health check
        run: |
          sleep 10
          curl -f https://api-docuagent.angelezequiel.dev/api/v1/health || exit 1
```

---

## Secrets de GitHub (configurar en Settings → Secrets)

| Secret | Descripción |
|--------|-------------|
| `OCIR_REGISTRY` | Registry de OCI (ej: `<region>.ocir.io/<namespace>`) |
| `OCIR_USER` | Usuario de OCIR (ej: `<namespace>/oracleidentitycloudservice/<email>`) |
| `OCIR_TOKEN` | Auth token de OCIR |

---

## Flujo completo

```mermaid
flowchart LR
    PR[PR a develop] -->|CI pasa| DEV[Merge a develop]
    DEV -->|Probado local con tunnel| PR2[PR a main]
    PR2 -->|CI pasa| MAIN[Merge a main]
    MAIN -->|images.yml| OCIR[Push a OCIR]
    OCIR -->|deploy-prod.yml manual| OCI[Deploy OCI]

    style MAIN fill:#2ecc71,color:#fff
    style OCIR fill:#3498db,color:#fff
    style OCI fill:#e74c3c,color:#fff
```
