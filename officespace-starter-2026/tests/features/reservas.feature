# language: es
Característica: Motor de reservas
  Como colaborador autenticado
  Quiero reservar espacios sin conflictos
  Para garantizar que el motor de reservas sea infalible

  Antecedentes:
    Dado que el sistema está levantado
    Y que inicié sesión como "carlos.mendez@corporativoalpha.com" con contraseña "User123"
    Y que existe el espacio "ESP-001" con capacidad 12

  Escenario: Crear una reserva válida
    Cuando creo una reserva en "ESP-001" de "2026-09-01T10:00:00Z" a "2026-09-01T11:00:00Z" para 6 asistentes
    Entonces la respuesta tiene código 201
    Y la reserva queda con estado "programada"

  Escenario: No permitir reservas solapadas
    Dado que existe una reserva en "ESP-001" de "2026-09-01T10:00:00Z" a "2026-09-01T12:00:00Z"
    Cuando creo una reserva en "ESP-001" de "2026-09-01T11:00:00Z" a "2026-09-01T13:00:00Z" para 2 asistentes
    Entonces la respuesta tiene código 409
    Y el mensaje indica que el espacio ya está reservado

  Escenario: Permitir reservas consecutivas (fin exclusivo)
    Dado que existe una reserva en "ESP-001" de "2026-09-02T10:00:00Z" a "2026-09-02T11:00:00Z"
    Cuando creo una reserva en "ESP-001" de "2026-09-02T11:00:00Z" a "2026-09-02T12:00:00Z" para 2 asistentes
    Entonces la respuesta tiene código 201

  Escenario: Rechazar fin anterior al inicio
    Cuando creo una reserva en "ESP-001" de "2026-09-03T12:00:00Z" a "2026-09-03T10:00:00Z" para 2 asistentes
    Entonces la respuesta tiene código 400

  Escenario: Rechazar reservas en el pasado
    Cuando creo una reserva en "ESP-001" de "2020-01-01T10:00:00Z" a "2020-01-01T11:00:00Z" para 2 asistentes
    Entonces la respuesta tiene código 400

  Escenario: Rechazar duración mayor a 8 horas
    Cuando creo una reserva en "ESP-001" de "2026-09-04T09:00:00Z" a "2026-09-04T18:00:00Z" para 2 asistentes
    Entonces la respuesta tiene código 400

  Esquema del escenario: Validar capacidad contra asistentes
    Cuando creo una reserva en "<espacio>" para <asistentes> asistentes
    Entonces la respuesta tiene código <codigo>

    Ejemplos:
      | espacio | asistentes | codigo |
      | ESP-001 | 12         | 201    |
      | ESP-002 | 5          | 400    |
