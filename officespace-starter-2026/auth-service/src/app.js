const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Documentación interactiva (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Ruta no encontrada
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('[auth-service] error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

module.exports = app;
