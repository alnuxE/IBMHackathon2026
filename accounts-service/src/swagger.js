// Especificación OpenAPI 3.0 del accounts-service (servida en /api-docs).
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'NeoWallet · accounts-service',
    version: '1.0.0',
    description: 'Usuarios, saldos y autenticación (JWT). Dueño de la tabla `users`.',
  },
  servers: [{ url: '/', description: 'Este servicio' }],
  tags: [
    { name: 'Auth', description: 'Autenticación' },
    { name: 'Cuentas', description: 'Usuarios y saldos' },
    { name: 'Interno', description: 'Servicio-a-servicio' },
    { name: 'Sistema' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      internalKey: { type: 'apiKey', in: 'header', name: 'X-Internal-Key' },
    },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string', example: 'user_not_found' } } },
      Credenciales: {
        type: 'object', required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'usuario.a@neowallet.com' },
          password: { type: 'string', example: 'neowallet123' },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Usuario A (Rico)' },
          email: { type: 'string', example: 'usuario.a@neowallet.com' },
          balance: { type: 'number', example: 1000 },
        },
      },
      LoginResp: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiInR...' },
          user: { $ref: '#/components/schemas/Usuario' },
        },
      },
      RechargeInput: {
        type: 'object', required: ['amount'],
        properties: {
          amount: { type: 'number', example: 100 },
          payment_method: { type: 'string', example: 'card' },
          idempotency_key: { type: 'string', example: 'rch-2026-0001' },
        },
      },
      UpdateBalanceInput: {
        type: 'object', required: ['user_id', 'amount', 'operation'],
        properties: {
          user_id: { type: 'integer', example: 1 },
          amount: { type: 'number', example: 50 },
          operation: { type: 'string', enum: ['debit', 'credit'] },
          op_key: { type: 'string', example: 'tx7:debit' },
        },
      },
    },
    responses: {
      NoAutenticado: { description: 'Falta o es inválido el token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      Prohibido: { description: 'Cuenta ajena', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
  paths: {
    '/health': { get: { tags: ['Sistema'], summary: 'Estado del servicio', responses: { 200: { description: 'OK' } } } },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login con email y contraseña',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Credenciales' } } } },
        responses: {
          200: { description: 'Token emitido', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResp' } } } },
          400: { description: 'Credenciales mal formadas' },
          401: { description: 'Credenciales incorrectas' },
        },
      },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Usuario autenticado', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } }, 401: { $ref: '#/components/responses/NoAutenticado' } } },
    },
    '/accounts': {
      get: { tags: ['Cuentas'], summary: 'Directorio de usuarios (sin saldos)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista' }, 401: { $ref: '#/components/responses/NoAutenticado' } } },
    },
    '/accounts/{userId}': {
      get: {
        tags: ['Cuentas'], summary: 'Saldo de una cuenta (solo la propia)',
        security: [{ bearerAuth: [] }, { internalKey: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } }, 401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/Prohibido' }, 404: { description: 'No existe' } },
      },
    },
    '/api/recharge': {
      post: {
        tags: ['Cuentas'], summary: 'Recargar la propia cuenta (idempotente)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RechargeInput' } } } },
        responses: { 200: { description: 'Nuevo saldo' }, 400: { description: 'Monto inválido' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 404: { description: 'No existe' } },
      },
    },
    '/accounts/update-balance': {
      post: {
        tags: ['Interno'], summary: 'Débito/crédito atómico e idempotente (servicio-a-servicio)',
        security: [{ internalKey: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBalanceInput' } } } },
        responses: { 200: { description: 'previous_balance / new_balance' }, 400: { description: 'invalid_amount / insufficient_funds / invalid_operation' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 404: { description: 'No existe' } },
      },
    },
  },
};
