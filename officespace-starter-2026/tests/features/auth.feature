# language: es
Característica: Autenticación y control de acceso
  Para proteger el sistema
  Solo usuarios autenticados pueden operar y solo los administradores gestionan espacios

  Escenario: Login exitoso
    Cuando hago login con "admin@corporativoalpha.com" y "Admin123"
    Entonces la respuesta tiene código 200
    Y recibo un token JWT
    Y mi rol es "ADMINISTRADOR"

  Escenario: Login con credenciales inválidas
    Cuando hago login con "admin@corporativoalpha.com" y "incorrecta"
    Entonces la respuesta tiene código 401
    Y no recibo token

  Escenario: Acceso sin token
    Cuando consulto "GET /spaces" sin token
    Entonces la respuesta tiene código 401

  Escenario: Crear espacio sin permisos
    Dado que inicié sesión como colaborador
    Cuando creo un espacio nuevo
    Entonces la respuesta tiene código 403

  Escenario: Crear espacio como administrador
    Dado que inicié sesión como administrador
    Cuando creo un espacio nuevo válido
    Entonces la respuesta tiene código 201
