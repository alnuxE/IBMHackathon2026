// Especificación OpenAPI 3.0 del catalog-service (servida en /api-docs).
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'OfficeSpace · Catalog Service',
    version: '1.0.0',
    description: 'Gestión de espacios de trabajo y catálogo dinámico de recursos.',
  },
  servers: [{ url: '/', description: 'catalog-service (puerto 4001)' }],
  tags: [
    { name: 'Espacios', description: 'CRUD de espacios (escritura solo ADMINISTRADOR)' },
    { name: 'Recursos', description: 'Catálogo de recursos (escritura solo ADMINISTRADOR)' },
    { name: 'Sistema' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' } } },
      Ubicacion: {
        type: 'object', required: ['edificio', 'piso'],
        properties: { edificio: { type: 'string', example: 'Torre A' }, piso: { type: 'integer', example: 3 }, numEscritorio: { type: 'string', nullable: true, example: 'E-14' } },
      },
      RecursoAsignado: {
        type: 'object',
        properties: { recursoId: { type: 'string' }, codigo: { type: 'string', example: 'REC-PROYECTOR' }, nombre: { type: 'string', example: 'Proyector' }, cantidad: { type: 'integer', example: 1 } },
      },
      Espacio: {
        type: 'object', required: ['codigo', 'nombre', 'tipo', 'capacidad', 'ubicacion'],
        properties: {
          _id: { type: 'string' },
          codigo: { type: 'string', example: 'ESP-001' },
          nombre: { type: 'string', example: 'Sala de Juntas Atlas' },
          tipo: { type: 'string', enum: ['sala_juntas', 'escritorio_individual'] },
          capacidad: { type: 'integer', example: 12 },
          recursos: { type: 'array', items: { $ref: '#/components/schemas/RecursoAsignado' } },
          ubicacion: { $ref: '#/components/schemas/Ubicacion' },
          status: { type: 'string', enum: ['alta', 'baja', 'ninguna'], description: 'Nivel de disponibilidad' },
        },
      },
      Recurso: {
        type: 'object', required: ['codigo', 'nombre'],
        properties: {
          _id: { type: 'string' },
          codigo: { type: 'string', example: 'REC-PROYECTOR' },
          nombre: { type: 'string', example: 'Proyector' },
          categoria: { type: 'string', example: 'audiovisual' },
          descripcion: { type: 'string' },
          activo: { type: 'boolean', example: true },
        },
      },
    },
    responses: {
      NoAutenticado: { description: 'Token ausente o inválido (401)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      SinPermiso: { description: 'Requiere rol ADMINISTRADOR (403)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      NoEncontrado: { description: 'Recurso no encontrado (404)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
  paths: {
    '/health': { get: { tags: ['Sistema'], summary: 'Healthcheck', responses: { 200: { description: 'OK' } } } },

    '/spaces': {
      get: {
        tags: ['Espacios'], summary: 'Listar espacios', security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['sala_juntas', 'escritorio_individual'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['alta', 'baja', 'ninguna'] } },
        ],
        responses: { 200: { description: 'Lista', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Espacio' } } } } }, 401: { $ref: '#/components/responses/NoAutenticado' } },
      },
      post: {
        tags: ['Espacios'], summary: 'Crear espacio', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Espacio' } } } },
        responses: { 201: { description: 'Creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Espacio' } } } }, 400: { description: 'Datos inválidos' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/SinPermiso' } },
      },
    },
    '/spaces/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: { tags: ['Espacios'], summary: 'Detalle de espacio', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Espacio', content: { 'application/json': { schema: { $ref: '#/components/schemas/Espacio' } } } }, 401: { $ref: '#/components/responses/NoAutenticado' }, 404: { $ref: '#/components/responses/NoEncontrado' } } },
      put: { tags: ['Espacios'], summary: 'Actualizar espacio', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Espacio' } } } }, responses: { 200: { description: 'Actualizado' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/SinPermiso' }, 404: { $ref: '#/components/responses/NoEncontrado' } } },
      delete: { tags: ['Espacios'], summary: 'Eliminar espacio', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Eliminado' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/SinPermiso' }, 404: { $ref: '#/components/responses/NoEncontrado' } } },
    },
    '/spaces/{id}/status': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      patch: { tags: ['Espacios'], summary: 'Cambiar status (uso interno booking)', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['alta', 'baja', 'ninguna'] } } } } } }, responses: { 200: { description: 'Actualizado' }, 401: { $ref: '#/components/responses/NoAutenticado' } } },
    },
    '/spaces/{id}/reservas': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      put: { tags: ['Espacios'], summary: 'Sincronizar reservas embebidas (uso interno booking)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Sincronizado' }, 401: { $ref: '#/components/responses/NoAutenticado' } } },
    },

    '/recursos': {
      get: { tags: ['Recursos'], summary: 'Listar recursos', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Recurso' } } } } }, 401: { $ref: '#/components/responses/NoAutenticado' } } },
      post: { tags: ['Recursos'], summary: 'Crear recurso', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Recurso' } } } }, responses: { 201: { description: 'Creado' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/SinPermiso' } } },
    },
    '/recursos/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: { tags: ['Recursos'], summary: 'Detalle de recurso', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Recurso' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 404: { $ref: '#/components/responses/NoEncontrado' } } },
      put: { tags: ['Recursos'], summary: 'Actualizar recurso', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Recurso' } } } }, responses: { 200: { description: 'Actualizado' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/SinPermiso' }, 404: { $ref: '#/components/responses/NoEncontrado' } } },
      delete: { tags: ['Recursos'], summary: 'Eliminar recurso', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Eliminado' }, 401: { $ref: '#/components/responses/NoAutenticado' }, 403: { $ref: '#/components/responses/SinPermiso' }, 404: { $ref: '#/components/responses/NoEncontrado' } } },
    },
  },
};
