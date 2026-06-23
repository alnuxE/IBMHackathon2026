# language: es
Característica: Idempotencia y resiliencia ante fallos de red
  Como sistema de dinero
  Quiero que los reintentos por timeout o doble click no dupliquen movimientos
  Para no cobrar dos veces ni crear/destruir dinero

  Antecedentes:
    Dado que el sistema está levantado
    Y que inicié sesión como "usuario.a@neowallet.com"

  Escenario: Reintento de una transferencia con la misma clave
    Cuando transfiero 30.00 a "usuario.b@neowallet.com" con clave de idempotencia "trf-001"
    Y repito la misma transferencia con la clave "trf-001"
    Entonces la segunda respuesta indica "idempotent_replay"
    Y mi cuenta se debita una sola vez
    Y solo existe una transacción con la clave "trf-001"

  Escenario: Doble envío concurrente con la misma clave
    Cuando lanzo dos transferencias idénticas en paralelo con la clave "trf-race"
    Entonces el débito total es de un solo monto
    Y solo se crea una transacción

  Escenario: Recarga idempotente
    Cuando recargo 20.00 con clave de idempotencia "rch-001"
    Y repito la misma recarga con la clave "rch-001"
    Entonces mi saldo aumenta una sola vez

  Escenario: Movimiento de saldo interno idempotente
    Dado un crédito interno con op_key "manual:credit-1" por 7.00
    Cuando repito el mismo crédito con op_key "manual:credit-1"
    Entonces el saldo se acredita una sola vez
