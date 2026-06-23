// Especificación OpenAPI 3.0 del processor-service (servida en /api-docs).
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'NeoWallet · processor-service',
    version: '1.0.0',
    description: 'Transferencias P2P (patrón Saga, idempotentes) e historial. Expone además un gateway WebSocket (Socket.IO) en el mismo puerto.',
  },
  servers: [{ url: '/', description: 'Este servicio' }],
  tags: [
    { name: 'Transferencias', description: 'Pagos P2P' },
    { name: 'Sistema' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string', example: 'insufficient_funds' } } },
      TransferInput: {
        type: 'object', required: ['receiver_id', 'amount'],
        properties: {
          receiver_id: { type: 'integer', example: 2 },
          amount: { type: 'number', example: 100 },
          idempotency_key: { type: 'string', example: 'trf-2026-0001' },
        },
      },
      TransferResp: {
        type: 'object',
        properties: {
          transaction_id: { type: 'integer', example: 1 },
          status: { type: 'string', example: 'COMPLETED' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          sender_id: { type: 'integer' },
          receiver_id: { type: 'integer' },
          amount: { type: 'number' },
          status: { type: 'string', enum: ['PENDING', 'DEBITED', 'COMPLETED', 'FAILED', 'ROLLED_BACK'] },
          type: { type: 'string', enum: ['sent', 'received'] },
          counterparty_id: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      NoAutenticado: { description: 'Falta o es inválido el token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
  paths: {
    '/health': { get: { tags: ['Sistema'], summary: 'Estado del servicio', responses: { 200: { description: 'OK' } } } },
    '/api/transfer': {
      post: {
        tags: ['Transferencias'],
        summary: 'Transferencia P2P (el emisor es el usuario del token)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TransferInput' } } } },
        responses: {
          201: { description: 'Completada', content: { 'application/json': { schema: { $ref: '#/components/schemas/TransferResp' } } } },
          400: { description: 'invalid_amount / self_transfer_not_allowed / insufficient_funds' },
          401: { $ref: '#/components/responses/NoAutenticado' },
          404: { description: 'Receptor no existe' },
          409: { description: 'rolled_back / in_progress' },
        },
      },
    },
    '/api/transactions/{userId}': {
      get: {
        tags: ['Transferencias'],
        summary: 'Historial propio (enviadas + recibidas)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Lista', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } } } } },
          401: { $ref: '#/components/responses/NoAutenticado' },
          403: { description: 'Historial ajeno' },
        },
      },
    },
  },
};
