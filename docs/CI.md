# Integración Continua (CI) — NeoWallet

Pipeline declarativo de **Jenkins** ([`Jenkinsfile`](../Jenkinsfile)) que verifica
cada commit de extremo a extremo con Docker.

## Qué hace en cada commit

1. **Checkout** del repositorio.
2. **Validar sintaxis (backend)** — `node --check` sobre todos los `.js` de los
   microservicios (dentro de `node:20-alpine`, sin instalar dependencias).
3. **Build** — `docker compose build` (las tres imágenes).
4. **Levantar stack** — `docker compose up -d` (servicios + bases de datos).
5. **Healthchecks** — espera con reintentos a `/health` de accounts y processor.
6. **Pruebas de API (Newman)** — ejecuta la colección Postman
   [`tests/postman/NeoWallet.postman_collection.json`](../tests/postman/NeoWallet.postman_collection.json)
   contra el stack vivo (auth, saldos, transferencias, idempotencia, interno, historial).
7. **Cleanup** (`post { always }`) — `docker compose down -v` siempre; ante fallo,
   vuelca los últimos logs.

## Requisitos del agente

- Docker + Docker Compose v2.
- Acceso a la red `localhost` (los healthchecks y Newman usan `--network host`).

## Cómo configurarlo en Jenkins

1. **Nuevo item** → *Pipeline*.
2. **Pipeline → Definition**: *Pipeline script from SCM*.
3. **SCM**: Git, URL del repo, rama `DevelOpWallet`.
4. **Script Path**: `Jenkinsfile`.
5. **Build Now**.

## Ejecutar las mismas pruebas en local

Con el stack ya levantado (`docker compose up`):

```bash
docker run --rm --network host \
  -v "$PWD/tests/postman:/etc/newman" \
  postman/newman:alpine run /etc/newman/NeoWallet.postman_collection.json
```

> Las features BDD ([`tests/features/`](../tests/features/)) y los casos manuales
> ([`tests/TEST_CASES.md`](../tests/TEST_CASES.md)) documentan el comportamiento;
> la colección Postman es la suite **automatizada** que corre en CI.
