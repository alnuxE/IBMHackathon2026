const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const reservaRoutes = require('./routes/reservaRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Documentación interactiva (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'booking-service' }));

app.use('/reservas', reservaRoutes);

// Ruta no encontrada
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('[booking-service] error:', err.message);
  const status = err.status || (err.name === 'CastError' ? 400 : 500);
  res.status(status).json({ error: err.message || 'Error interno' });
});

module.exports = app;
