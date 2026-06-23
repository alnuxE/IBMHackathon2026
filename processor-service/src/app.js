const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const processorRoutes = require('./routes/processor.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Documentación interactiva de la API (OpenAPI 3.0)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'processor-service' });
});

app.use('/', processorRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// Manejador de errores centralizado
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[processor-service] error:', err);
  res.status(500).json({ error: 'internal_error' });
});

module.exports = app;
