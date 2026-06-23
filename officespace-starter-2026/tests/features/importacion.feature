# language: es
Característica: Migración e importación de reservas
  Como administrador
  Quiero importar el histórico del Excel compartido
  Para migrar al sistema sin perder información y detectar datos inválidos

  Antecedentes:
    Dado que inicié sesión como administrador
    Y que existen los espacios "ESP-001" (cap 12), "ESP-002" (cap 1) y "ESP-003" (cap 20)

  Escenario: Importación masiva válida
    Cuando importo un archivo con 220 reservas válidas
    Entonces la respuesta tiene código 201
    Y el resumen indica 220 importadas y 0 rechazadas

  Escenario: Filas inválidas se rechazan con motivo
    Cuando importo reservas que incluyen una con asistentes 9 para "ESP-002"
    Y una con espacio "ESP-999" inexistente
    Entonces esas dos filas aparecen en "rechazadas" con su motivo
    Y las demás filas válidas sí se importan

  Escenario: Importar requiere rol administrador
    Dado que inicié sesión como colaborador
    Cuando intento importar reservas
    Entonces la respuesta tiene código 403

  Escenario: Exportar e importar es ida y vuelta
    Dado que hay reservas en el sistema
    Cuando exporto a Excel y vuelvo a importar el archivo
    Entonces las reservas válidas se cargan correctamente
