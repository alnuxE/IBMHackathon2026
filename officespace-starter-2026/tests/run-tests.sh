#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Runner de pruebas automatizadas — OfficeSpace (Escenario 1)
#
# Un solo comando: levanta el stack, espera los health checks, ejecuta la
# colección Postman con Newman (en Docker, sin instalar nada) y exporta un
# reporte JUnit para CI. Devuelve el código de salida de Newman (0 = todo OK).
#
# Uso:
#   ./tests/run-tests.sh            # build + up + pruebas + down
#   ./tests/run-tests.sh --no-build # usa las imágenes existentes (más rápido)
#   ./tests/run-tests.sh --keep     # deja el stack levantado al terminar
#   ./tests/run-tests.sh --clean    # al terminar hace 'down -v' (borra datos)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuración del proyecto ───────────────────────────────────────────────
PROJECT="OfficeSpace"
COLLECTION="OfficeSpace.postman_collection.json"
HEALTH_URLS=("http://localhost:4000/health" "http://localhost:4001/health" "http://localhost:4002/health")
UP_SERVICES="mongo auth-service catalog-service booking-service"

# ── Flags ────────────────────────────────────────────────────────────────────
BUILD=1; KEEP=0; CLEAN=0
for arg in "$@"; do case "$arg" in
  --no-build) BUILD=0 ;;
  --keep)     KEEP=1 ;;
  --clean)    CLEAN=1 ;;
  -h|--help)  grep -E '^#( |$)' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  *) echo "Opción desconocida: $arg (usa -h)"; exit 2 ;;
esac; done

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # raíz del proyecto
REPORTS="tests/reports"; mkdir -p "$REPORTS"

say(){ printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }

command -v docker >/dev/null 2>&1 || { echo "❌ Docker no está instalado."; exit 1; }

say "[$PROJECT] Levantando el stack de pruebas"
if [ "$BUILD" = 1 ]; then
  docker compose up -d --build $UP_SERVICES
else
  docker compose up -d $UP_SERVICES
fi

say "Esperando health checks"
for url in "${HEALTH_URLS[@]}"; do
  printf '  %-40s ' "$url"
  ok=0
  for _ in $(seq 1 30); do
    if curl -sf "$url" >/dev/null 2>&1; then echo "OK"; ok=1; break; fi
    sleep 2
  done
  if [ "$ok" = 0 ]; then echo "TIMEOUT"; docker compose logs --tail=80 || true; exit 1; fi
done

say "Ejecutando Newman — $COLLECTION"
set +e
docker run --rm --network host \
  --user "$(id -u):$(id -g)" \
  -v "$PWD/tests/postman:/etc/newman:ro" \
  -v "$PWD/$REPORTS:/reports" \
  postman/newman:alpine run "/etc/newman/$COLLECTION" \
  --reporters cli,junit \
  --reporter-junit-export "/reports/newman-junit.xml"
CODE=$?
set -e

say "Resultado"
if [ "$CODE" = 0 ]; then
  echo "✅ Todas las pruebas pasaron.  Reporte JUnit: $REPORTS/newman-junit.xml"
else
  echo "❌ Hubo fallos (código $CODE).  Reporte JUnit: $REPORTS/newman-junit.xml"
fi

if   [ "$CLEAN" = 1 ]; then say "Limpiando (down -v)";       docker compose down -v || true
elif [ "$KEEP"  = 0 ]; then say "Deteniendo el stack (down)"; docker compose down   || true
else say "Stack en marcha (--keep)"; fi

exit $CODE
