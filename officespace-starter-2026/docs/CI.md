# Integración Continua (Jenkins)

El pipeline está definido en [`Jenkinsfile`](../Jenkinsfile) (pipeline declarativo).

## Qué hace en cada commit

1. **Checkout** del repositorio.
2. **Validar sintaxis** del backend (`node --check` dentro de una imagen `node:20-alpine`).
3. **Build** de las imágenes con `docker compose build`.
4. **Levantar** el stack (`docker compose up -d`).
5. **Healthchecks** de auth/catalog/booking (`/health`, con reintentos).
6. **Pruebas de API** con **Newman** (la colección de Postman) usando la imagen
   `postman/newman:alpine` contra el stack levantado.
7. **Siempre** baja el entorno (`docker compose down -v`); si algo falla, vuelca logs.

## Requisitos del agente

- **Docker** y **Docker Compose v2** disponibles.
- Acceso de red a `localhost:3000/4000/4001/4002` (se usa `--network host` para Newman).

## Cómo configurarlo en Jenkins

1. Nuevo item → **Pipeline** (o **Multibranch Pipeline** apuntando al repo).
2. *Pipeline → Definition:* **Pipeline script from SCM**.
3. *SCM:* Git → URL del repo, rama `develop` (o la que quieras validar).
4. *Script Path:* `officespace-starter-2026/Jenkinsfile`.
5. Guardar y **Build Now**. (Para CI automático: webhook de GitHub o *Poll SCM*.)

## Ejecutar las mismas pruebas en local

```bash
cd officespace-starter-2026
docker compose up -d --build
docker run --rm --network host \
  -v "$PWD/tests/postman:/etc/newman" \
  postman/newman:alpine run /etc/newman/OfficeSpace.postman_collection.json
```
