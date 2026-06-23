#!/usr/bin/env bash
# Utilidad opcional: espera a que MongoDB responda antes de arrancar un servicio.
# En este proyecto usamos el healthcheck de docker-compose, pero se deja por si
# quieres arrancar un servicio fuera de Docker.
set -e
HOST="${1:-localhost}"
PORT="${2:-27017}"
echo "Esperando a MongoDB en ${HOST}:${PORT}..."
until nc -z "$HOST" "$PORT"; do
  sleep 1
done
echo "MongoDB disponible."
