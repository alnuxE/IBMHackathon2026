# language: es
Característica: Autenticación y control de acceso
  Para proteger el dinero de los usuarios
  Solo usuarios autenticados pueden operar, y cada uno solo sobre su propia cuenta

  Antecedentes:
    Dado que el sistema está levantado
    Y existen los usuarios semilla con contraseña "neowallet123"

  Escenario: Login exitoso
    Cuando hago login con "usuario.a@neowallet.com" y "neowallet123"
    Entonces la respuesta tiene código 200
    Y recibo un token JWT
    Y recibo mis datos de usuario

  Escenario: Login con contraseña incorrecta
    Cuando hago login con "usuario.a@neowallet.com" y "incorrecta"
    Entonces la respuesta tiene código 401
    Y el error es "invalid_credentials"

  Escenario: Acceder a un endpoint protegido sin token
    Cuando consulto el directorio de usuarios sin token
    Entonces la respuesta tiene código 401

  Escenario: Token inválido
    Cuando consulto "/auth/me" con un token "basura"
    Entonces la respuesta tiene código 401

  Escenario: Un usuario no puede ver el saldo de otra cuenta
    Dado que inicié sesión como "usuario.a@neowallet.com"
    Cuando consulto el saldo de la cuenta de "usuario.b@neowallet.com"
    Entonces la respuesta tiene código 403

  Escenario: El endpoint interno rechaza a los usuarios finales
    Dado que inicié sesión como "usuario.a@neowallet.com"
    Cuando llamo a "/accounts/update-balance" con mi token de usuario
    Entonces la respuesta tiene código 401
