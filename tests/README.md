# Pruebas automatizadas — NeoWallet

Suite de pruebas de API ejecutable con **un solo comando**, sin instalar nada más
que Docker (Newman corre dentro de un contenedor).

## Requisitos

- Docker + Docker Compose v2
- `curl` (para los health checks)

## Ejecutar todo (recomendado)

Desde la raíz del proyecto:

```bash
./tests/run-tests.sh
```

Esto: construye las imágenes → levanta el stack → espera los health checks →
ejecuta la colección Postman con Newman → genera un reporte JUnit → baja el stack.
El **código de salida es 0 solo si todas las pruebas pasan** (apto para CI).

### Opciones

| Flag | Efecto |
|------|--------|
| `--no-build` | Usa las imágenes existentes (más rápido si ya construiste) |
| `--keep` | Deja el stack levantado al terminar |
| `--clean` | Al terminar hace `docker compose down -v` (borra datos) |

```bash
./tests/run-tests.sh --no-build --keep
```

## Qué se prueba

29 requests / 50 aserciones que cubren: autenticación, autorización por
propietario, saldos, recargas e **idempotencia**, motor de transferencias
(camino feliz + errores + anti-spoofing), endpoint interno, historial y
**estados de cuenta (JSON y PDF)**. Trazabilidad completa en
[`TEST_CASES.md`](./TEST_CASES.md).

## Reporte

Tras la corrida se genera `tests/reports/newman-junit.xml` (formato JUnit, para
integrarlo en Jenkins/GitLab/etc.).

## Ejecutar Newman a mano (si el stack ya está arriba)

```bash
docker run --rm --network host -v "$PWD/tests/postman:/etc/newman" \
  postman/newman:alpine run /etc/newman/NeoWallet.postman_collection.json
```

## Otros artefactos de prueba

- [`features/`](./features/) — escenarios BDD (Gherkin, español) que documentan el comportamiento.
- [`TEST_CASES.md`](./TEST_CASES.md) — casos manuales CP-XX trazables a requisitos.
- [`../Jenkinsfile`](../Jenkinsfile) — pipeline CI que ejecuta esta misma suite.

## Problemas comunes

- **Puerto ocupado (3000/3001):** no corras a la vez otro proyecto que use esos
  puertos. El runner no levanta el frontend (no hace falta para las pruebas de API).
- **`TIMEOUT` en health:** revisa `docker compose logs accounts-service processor-service`.
