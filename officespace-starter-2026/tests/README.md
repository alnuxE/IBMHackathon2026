# Pruebas automatizadas — OfficeSpace

Suite de pruebas de API ejecutable con **un solo comando**, sin instalar nada más
que Docker (Newman corre dentro de un contenedor).

## Requisitos

- Docker + Docker Compose v2
- `curl` (para los health checks)

## Ejecutar todo (recomendado)

Desde la raíz del proyecto (`officespace-starter-2026/`):

```bash
./tests/run-tests.sh
```

Esto: construye las imágenes → levanta el stack (MongoDB + auth/catalog/booking) →
espera los health checks → ejecuta la colección Postman con Newman → genera un
reporte JUnit → baja el stack. **Código de salida 0 solo si todo pasa** (apto para CI).

### Opciones

| Flag | Efecto |
|------|--------|
| `--no-build` | Usa las imágenes existentes (más rápido) |
| `--keep` | Deja el stack levantado al terminar |
| `--clean` | Al terminar hace `docker compose down -v` (borra datos) |

## Qué se prueba

Autenticación y roles (admin/colaborador), catálogo de espacios y recursos, y el
**motor de reservas** (validaciones, no-solapamiento, capacidad, permisos) e
importación. Trazabilidad en [`TEST_CASES.md`](./TEST_CASES.md).

## Reporte

Tras la corrida se genera `tests/reports/newman-junit.xml` (formato JUnit).

## Ejecutar Newman a mano (si el stack ya está arriba)

```bash
docker run --rm --network host -v "$PWD/tests/postman:/etc/newman" \
  postman/newman:alpine run /etc/newman/OfficeSpace.postman_collection.json
```

## Otros artefactos de prueba

- [`features/`](./features/) — escenarios BDD (Gherkin, español).
- [`TEST_CASES.md`](./TEST_CASES.md) — casos manuales.
- [`../Jenkinsfile`](../Jenkinsfile) — pipeline CI que ejecuta esta misma suite.

## Problemas comunes

- **Puerto 3000 ocupado:** el runner **no** levanta el frontend (no hace falta para
  las pruebas de API), así que puede convivir con otros proyectos. Para la UI usa
  `docker compose up` por separado.
- **`TIMEOUT` en health:** revisa `docker compose logs auth-service catalog-service booking-service`.
