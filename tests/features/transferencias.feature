# language: es
Característica: Motor de transferencias P2P
  Como usuario autenticado
  Quiero transferir dinero a otro usuario sin errores
  Para que el motor de pagos sea infalible y nunca se pierda ni se cree dinero

  Antecedentes:
    Dado que el sistema está levantado
    Y que inicié sesión como "usuario.a@neowallet.com"

  Escenario: Transferencia válida
    Dado que tengo saldo suficiente
    Cuando transfiero 100.00 a "usuario.b@neowallet.com"
    Entonces la respuesta tiene código 201
    Y el estado de la transacción es "COMPLETED"
    Y mi saldo disminuye en 100.00
    Y el saldo del receptor aumenta en 100.00

  Escenario: No puedo transferirme a mí mismo
    Cuando transfiero 10.00 a "usuario.a@neowallet.com"
    Entonces la respuesta tiene código 400
    Y el error es "self_transfer_not_allowed"

  Escenario: No puedo transferir con fondos insuficientes
    Cuando transfiero 9999999.00 a "usuario.b@neowallet.com"
    Entonces la respuesta tiene código 400
    Y el error es "insufficient_funds"
    Y ningún saldo cambia

  Escenario: No puedo transferir a un usuario inexistente
    Cuando transfiero 10.00 al usuario inexistente 99999
    Entonces la respuesta tiene código 404
    Y el error es "user_not_found"

  Esquema del escenario: Montos inválidos
    Cuando transfiero <monto> a "usuario.b@neowallet.com"
    Entonces la respuesta tiene código 400
    Y el error es "invalid_amount"

    Ejemplos:
      | monto   |
      | 0       |
      | -5      |
      | 1.999   |

  Escenario: El emisor siempre sale del token, no del body (anti-spoofing)
    Cuando transfiero 25.00 a "usuario.c@neowallet.com" falsificando el sender_id de otro usuario
    Entonces el débito sale de mi cuenta (la del token)
    Y la cuenta falsificada no cambia

  Escenario: La suma total de dinero se conserva
    Dado que registro la suma de todos los saldos
    Cuando transfiero 12.50 a "usuario.c@neowallet.com"
    Entonces la suma total de saldos es la misma que antes
