// Especificación OpenAPI 3.0 del auth-service (servida en /api-docs).
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'OfficeSpace · Auth Service',
    version: '1.0.0',
    description: 'Autenticación (JWT) y gestión de usuarios. Corporativo Alpha.',
  },
  servers: [{ url: '/', description: 'auth-service (puerto 4000)' }],
  tags: [
    { name: 'Auth', description: 'Inicio de sesión' },
    { name: 'Usuarios', description: 'Gestión de usuarios (solo ADMINISTRADOR)' },
    { name: 'Sistema' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string', example: 'Credenciales inválidas' } } },
      Credenciales: {
        type: 'object', required: ['usuario', 'password'],
        properties: {
          usuario: { type: 'string', example: 'admin@corporativoalpha.com' },
          password: { type: 'string', example: 'Admin123' },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6a39...' },
          usuario: { type: 'string', example: 'carlos.mendez@corporativoalpha.com' },
          rol: { type: 'string', enum: ['ADMINISTRADOR', 'COLABORADOR'] },
        },
      },
      LoginResp: {
        type: 'object',
        properties: { user: { $ref: '#/components/schemas/Usuario' }, token: { type: 'string', example: 'eyJhbGciOiJI...' } },
      },
      UsuarioInput: {
        type: 'object', required: ['usuario', 'password', 'rol'],
        properties: {
          usuario: { type: 'string', example: 'nuevo@corporativoalpha.com' },
          password: { type: 'string', example: 'User123' },
          rol: { type: 'string', enum: ['ADMINISTRADOR', 'COLABORADOR'] },
        },
      },
    },
    responses: {
      NoAutenticado: { description: 'Token ausente o inválido (401)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      SinPermiso: { description: 'Rol sin permisos (403)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
  paths: {
    '/health': { get: { tags: ['Sistema'], summary: 'Healthcheck', responses: { 200: { description: 'OK' } } } },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Iniciar sesión y obtener token JWT',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Credenciales' } } } },
        responses: {
          200: { description: 'Token emitido', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResp' } } } },
          400: { description: 'Faltan campos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/NoAutenticado' },
          500: { description: 'Error interno' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Usuarios'], summary: 'Listar usuarios', security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de usuarios', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Usuario' } } } } },
          401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/SinPermiso' },
        },
      },
      post: {
        tags: ['Usuarios'], summary: 'Crear usuario', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UsuarioInput' } } } },
        responses: {
          201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          400: { description: 'Datos inválidos' }, 401: { $ref: '#/components/responses/NoAutenticado' },
          403: { $ref: '#/components/responses/SinPermiso' }, 409: { description: 'El usuario ya existe' },
        },
      },
    },
    '/users/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      put: {
        tags: ['Usuarios'], summary: 'Actualizar usuario (rol/contraseña)', security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { rol: { type: 'string', enum: ['ADMINISTRADOR', 'COLABORADOR'] }, password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Actualizado' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/SinPermiso' }, 404: { description: 'No encontrado' } },
      },
      delete: {
        tags: ['Usuarios'], summary: 'Eliminar usuario', security: [{ bearerAuth: [] }],
        responses: { 204: { description: 'Eliminado' }, 400: { description: 'No puedes eliminar tu propio usuario' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/SinPermiso' }, 404: { description: 'No encontrado' } },
      },
    },
  },
};
