# Datos de ejemplo — histórico de reservas

Simula el **Excel compartido** que usaba Corporativo Alpha antes del sistema.

- `historico-reservas.xlsx` — 220 reservas (Excel real)
- `historico-reservas.csv` — las mismas 220 reservas en CSV

Cubren ~3 meses de historial y reservas próximas, en los 3 espacios del seed
(ESP-001, ESP-002, ESP-003), con varios usuarios, horarios y asistentes.

## Cómo importarlo (demo)

1. Inicia sesión como **admin@corporativoalpha.com / Admin123**.
2. Ve a **Admin → Reservas → Importar Excel** y elige este archivo.
3. El sistema migra las reservas (validando capacidad y fechas) y muestra un
   resumen de importadas/rechazadas. Luego puedes filtrarlas o **volver a exportarlas**.

## Columnas

`Codigo`, `Usuario`, `FechaInicio` (ISO), `FechaFin` (ISO), `Asistentes`, `Estado`.

El sistema resuelve el espacio por `Codigo`, valida que `Asistentes` no exceda la
capacidad y asigna el estado por tiempo (las fechas pasadas quedan como `finalizada`).
