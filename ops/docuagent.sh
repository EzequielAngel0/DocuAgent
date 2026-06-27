#!/usr/bin/env bash
# ============================================================
# DocuAgent - runner de contenedores PRODUCCION (Ubuntu 24.04)
#
# Uso:  ./ops/docuagent.sh <accion> [args...]
#   accion: up | down | restart | pull | logs | ps | migrate | clean | prune | env | help
#
# Produccion en OCI: pull de imagenes desde OCIR (NO build local).
# Desarrollo local se opera en Windows con: .\ops\docuagent.ps1 <accion>
# ============================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_BASE="$ROOT/podman-compose.yml"
COMPOSE_PROD="$ROOT/podman-compose.prod.yml"
ENV_FILE="$ROOT/.env"
ENV_EXAMPLE="$ROOT/.env.example"

show_help() {
cat <<EOF

  DocuAgent - runner de contenedores (produccion)

  ./ops/docuagent.sh <accion> [args]

  Acciones:
    up        Levanta el stack (pull de OCIR + up)
    down      Detiene y elimina los contenedores
    restart   down + up
    pull      Descarga las imagenes mas recientes de OCIR
    logs      Sigue los logs (Ctrl-C para salir; args: nombre de servicio)
    ps        Estado de los contenedores
    migrate   Aplica migraciones de BD pendientes
    clean     down + elimina volumenes e imagenes locales
    prune     Limpieza profunda
    env       Muestra la configuracion activa
    help      Esta ayuda

  Servicios: backend, frontend, postgres, qdrant, cloudflared

EOF
}

# --- Detectar motor ---
CMD=""
if command -v podman &>/dev/null; then CMD="podman"
elif command -v docker &>/dev/null; then CMD="docker"
else echo "[ERROR] Ni Podman ni Docker estan instalados."; exit 1; fi

# --- Verificar .env ---
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_EXAMPLE" ]; then
    echo "[aviso] No existe .env. Creando desde .env.example -- rellenalo."
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  else
    echo "[ERROR] No existe .env ni .env.example."
    exit 1
  fi
fi

compose() {
  $CMD compose -f "$COMPOSE_BASE" -f "$COMPOSE_PROD" --env-file "$ENV_FILE" "$@"
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
    echo "Compose:  $COMPOSE_BASE + $COMPOSE_PROD"
    echo ".env:     $ENV_FILE"
    echo ""
    echo "Servicios:"
    compose config --services
    ;;

  pull)
    echo "[pull] Descargando imagenes desde OCIR..."
    compose pull
    ;;

  up)
    echo "[up] Levantando stack de produccion..."
    compose pull
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
    compose pull
    compose up -d
    prune_light
    echo "[restart] Listo."
    ;;

  migrate)
    echo "[migrate] Aplicando migraciones..."
    compose run --rm backend alembic upgrade head
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
