#!/usr/bin/env bash
# ============================================================
# DocuAgent - runner de contenedores PRODUCCION (Ubuntu 24.04)
#
# Uso:  ./ops/docuagent.sh <accion> [args...]
#   accion: up | down | restart | pull | logs | ps | migrate | clean | prune | env | help
#
# Produccion en OCI. Dos modos segun DEPLOY_MODE en .env.prod:
#   (vacio/ocir)  pull de imagenes desde OCIR (deploy via GitHub Actions)
#   local         build en la propia VM, sin registro (portafolio en 1 VM)
# Desarrollo local se opera en Windows con: .\ops\docuagent.ps1 <accion>
# ============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_BASE="$ROOT/podman-compose.yml"
COMPOSE_PROD="$ROOT/podman-compose.prod.yml"
COMPOSE_PROD_LOCAL="$ROOT/podman-compose.prod-local.yml"
ENV_FILE="$ROOT/.env.prod"
ENV_EXAMPLE="$ROOT/.env.example"

show_help() {
cat <<EOF

  DocuAgent - runner de contenedores (produccion)

  ./ops/docuagent.sh <accion> [args]

  Acciones:
    up        Levanta el stack (pull/build de imagenes + up)
    down      Detiene y elimina los contenedores
    restart   down + up
    pull      Actualiza imagenes: pull de OCIR o build local segun el modo
    build     Alias de pull (natural en modo DEPLOY_MODE=local)
    logs      Sigue los logs (Ctrl-C para salir; args: nombre de servicio)
    ps        Estado de los contenedores
    migrate   Aplica migraciones de BD pendientes
    seed      Indexa los documentos de ejemplo (backend/documents) en Qdrant+BD
    clean     down + elimina volumenes e imagenes locales
    prune     Limpieza profunda
    env       Muestra la configuracion activa
    help      Esta ayuda

  Servicios: backend, frontend, postgres, qdrant, cloudflared

  Modo (DEPLOY_MODE en .env.prod):
    (vacio/ocir)  pull de imagenes desde OCIR
    local         build en la propia VM (usa podman-compose.prod-local.yml)

EOF
}

# --- Detectar motor ---
CMD=""
if command -v podman &>/dev/null; then CMD="podman"
elif command -v docker &>/dev/null; then CMD="docker"
else echo "[ERROR] Ni Podman ni Docker estan instalados."; exit 1; fi

# --- Verificar .env.prod ---
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_EXAMPLE" ]; then
    echo "[aviso] No existe .env.prod. Creando desde .env.example -- rellenalo."
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  else
    echo "[ERROR] No existe .env.prod ni .env.example."
    exit 1
  fi
fi

# --- Modo de despliegue ---
# DEPLOY_MODE=local en .env.prod: build en la propia VM (sin OCIR).
# Cualquier otro valor (o vacio): pull de imagenes desde OCIR.
DEPLOY_MODE="$(sed -n 's/^DEPLOY_MODE=//p' "$ENV_FILE" | tr -d '\r' | tail -n 1)"

COMPOSE_FILES=(-f "$COMPOSE_BASE" -f "$COMPOSE_PROD")
if [ "$DEPLOY_MODE" = "local" ]; then
  COMPOSE_FILES+=(-f "$COMPOSE_PROD_LOCAL")
fi

compose() {
  ENV_FILE=".env.prod" $CMD compose "${COMPOSE_FILES[@]}" --env-file "$ENV_FILE" "$@"
}

# Actualiza las imagenes de la app: pull (modo ocir) o build (modo local)
fetch_images() {
  if [ "$DEPLOY_MODE" = "local" ]; then
    echo "[build] Construyendo imagenes en la VM (DEPLOY_MODE=local)..."
    compose build
  else
    echo "[pull] Descargando imagenes desde OCIR..."
    compose pull
  fi
}

prune_light() {
  $CMD container prune -f >/dev/null 2>&1 || true
  $CMD image prune -f >/dev/null 2>&1 || true
}

ACTION="${1:-help}"
shift || true

case "$ACTION" in
  help|-h|--help)
    show_help
    ;;

  env)
    echo "Motor:    $CMD"
    echo "Modo:     ${DEPLOY_MODE:-ocir}"
    echo "Compose:  ${COMPOSE_FILES[*]}"
    echo ".env:     $ENV_FILE"
    echo ""
    echo "Servicios:"
    compose config --services
    ;;

  pull|build)
    fetch_images
    ;;

  up)
    echo "[up] Levantando stack de produccion..."
    fetch_images
    compose up -d
    prune_light
    echo ""
    compose ps
    echo ""
    echo "Listo. El stack esta corriendo."
    echo "  Frontend: https://docuagent.angelezequiel.dev"
    echo "  API:      https://api-docuagent.angelezequiel.dev"
    ;;

  down)
    compose down
    ;;

  restart)
    compose down
    fetch_images
    compose up -d
    prune_light
    echo "[restart] Listo."
    ;;

  migrate)
    echo "[migrate] Aplicando migraciones..."
    compose run --rm backend alembic upgrade head
    ;;

  seed)
    echo "[seed] Indexando documentos de ejemplo (backend/documents)..."
    compose run --rm backend python -m app.scripts.seed_documents
    ;;

  logs)
    compose logs -f "$@"
    ;;

  ps|status)
    compose ps
    ;;

  clean)
    echo "[clean] Bajando contenedores, volumenes e imagenes del proyecto..."
    compose down -v --rmi local
    prune_light
    ;;

  prune)
    echo "[prune] Contenedores salidos + imagenes colgantes + cache..."
    $CMD container prune -f
    $CMD image prune -f
    $CMD builder prune -f 2>/dev/null || true
    ;;

  *)
    echo "[ERROR] Accion desconocida: '$ACTION'"
    show_help
    exit 1
    ;;
esac
