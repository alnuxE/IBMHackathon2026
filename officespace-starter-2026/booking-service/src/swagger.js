// Especificación OpenAPI 3.0 del booking-service (servida en /api-docs).
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'OfficeSpace · Booking Service',
    version: '1.0.0',
    description: 'Motor de reservas: validación de solapamiento, capacidad, fechas y ciclo de vida (programada → progreso → finalizada).',
  },
  servers: [{ url: '/', description: 'booking-service (puerto 4002)' }],
  tags: [
    { name: 'Reservas', description: 'Creación, consulta y cancelación de reservas' },
    { name: 'Sistema' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' } } },
      Errores: { type: 'object', properties: { errors: { type: 'array', items: { type: 'string' }, example: ['fechaInicio debe ser anterior a fechaFin'] } } },
      ReservaInput: {
        type: 'object', required: ['spaceId', 'fechaInicio', 'fechaFin', 'asistentes'],
        properties: {
          spaceId: { type: 'string', example: '6a39...' },
          fechaInicio: { type: 'string', format: 'date-time', example: '2026-09-01T10:00:00.000Z' },
          fechaFin: { type: 'string', format: 'date-time', example: '2026-09-01T11:00:00.000Z' },
          asistentes: { type: 'integer', minimum: 1, example: 6 },
        },
      },
      Reserva: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          spaceId: { type: 'string' },
          spaceCodigo: { type: 'string', example: 'ESP-001' },
          spaceNombre: { type: 'string', example: 'Sala de Juntas Atlas' },
          fechaInicio: { type: 'string', format: 'date-time' },
          fechaFin: { type: 'string', format: 'date-time' },
          asistentes: { type: 'integer', example: 6 },
          usuario: { type: 'string', example: 'carlos.mendez@corporativoalpha.com' },
          status: { type: 'string', enum: ['programada', 'progreso', 'finalizada', 'cancelada'] },
        },
      },
    },
    responses: {
      NoAutenticado: { description: 'Token ausente o inválido (401)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
  paths: {
    '/health': { get: { tags: ['Sistema'], summary: 'Healthcheck', responses: { 200: { description: 'OK' } } } },

    '/reservas': {
      get: {
        tags: ['Reservas'], summary: 'Todas las reservas (solo ADMINISTRADOR) — para exportar', security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Listado completo', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Reserva' } } } } },
          401: { $ref: '#/components/responses/NoAutenticado' },
          403: { description: 'Requiere rol ADMINISTRADOR' },
        },
      },
      post: {
        tags: ['Reservas'], summary: 'Crear reserva', security: [{ bearerAuth: [] }],
        description: 'Valida: campos obligatorios, fechas válidas, fin > inicio, no en el pasado, máx. 8 h, **capacidad** (asistentes ≤ capacidad) y **no solapamiento**.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReservaInput' } } } },
        responses: {
          201: { description: 'Reserva creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Reserva' } } } },
          400: { description: 'Validación fallida (fechas, asistentes o capacidad excedida)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Errores' } } } },
          401: { $ref: '#/components/responses/NoAutenticado' },
          404: { description: 'El espacio no existe', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Conflicto: el espacio ya está reservado en ese horario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          502: { description: 'No se pudo contactar al catálogo' },
        },
      },
    },
    '/reservas/me': {
      get: { tags: ['Reservas'], summary: 'Mis reservas (recalcula estados)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Reserva' } } } } }, 401: { $ref: '#/components/responses/NoAutenticado' } } },
    },
    '/reservas/import': {
      post: {
        tags: ['Reservas'], summary: 'Importación masiva desde Excel/CSV (solo ADMINISTRADOR)', security: [{ bearerAuth: [] }],
        description: 'Migra reservas en lote. Resuelve el espacio por código, valida fechas y capacidad (permite fechas pasadas) y asigna estado por tiempo. Devuelve un resumen con importadas y rechazadas.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { reservas: { type: 'array', items: {
            type: 'object',
            properties: {
              spaceCodigo: { type: 'string', example: 'ESP-001' },
              usuario: { type: 'string', example: 'carlos.mendez@corporativoalpha.com' },
              fechaInicio: { type: 'string', format: 'date-time' },
              fechaFin: { type: 'string', format: 'date-time' },
              asistentes: { type: 'integer', example: 6 },
            },
          } } } } } },
        },
        responses: {
          201: { description: 'Resumen { total, importadas, rechazadas[] }' },
          400: { description: 'Cuerpo inválido o demasiadas filas' },
          401: { $ref: '#/components/responses/NoAutenticado' },
          403: { description: 'Requiere rol ADMINISTRADOR' },
        },
      },
    },
    '/reservas/ocupados': {
      get: {
        tags: ['Reservas'], summary: 'spaceIds ocupados en un rango horario (buscador de disponibilidad)', security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'inicio', in: 'query', required: true, schema: { type: 'string', format: 'date-time' }, example: '2026-09-01T10:00:00.000Z' },
          { name: 'fin', in: 'query', required: true, schema: { type: 'string', format: 'date-time' }, example: '2026-09-01T12:00:00.000Z' },
        ],
        responses: { 200: { description: 'Array de spaceId ocupados', content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } } }, 400: { description: 'Faltan inicio/fin' }, 401: { $ref: '#/components/responses/NoAutenticado' } },
      },
    },
    '/reservas/space/{spaceId}': {
      parameters: [{ name: 'spaceId', in: 'path', required: true, schema: { type: 'string' } }],
      get: { tags: ['Reservas'], summary: 'Reservas activas de un espacio', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de reservas activas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Reserva' } } } } }, 401: { $ref: '#/components/responses/NoAutenticado' } } },
    },
    '/reservas/{id}/cancel': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      patch: {
        tags: ['Reservas'], summary: 'Cancelar una reserva propia (solo si está programada)', security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Reserva cancelada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Reserva' } } } },
          400: { description: 'Solo se pueden cancelar reservas programadas' },
          401: { $ref: '#/components/responses/NoAutenticado' },
          403: { description: 'No puedes cancelar la reserva de otro usuario' },
          404: { description: 'Reserva no encontrada' },
        },
      },
    },
    '/reservas/sync': {
      post: { tags: ['Reservas'], summary: 'Recalcular estados y sincronizar espacios (cron/manual)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Sincronizado' }, 401: { $ref: '#/components/responses/NoAutenticado' } } },
    },
  },
};
