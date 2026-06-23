const express = require('express');
const cors = require('cors');
const accountsRoutes = require('./routes/accounts.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check (RNF-002 / bonus observabilidad)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'accounts-service' });
});

// Rutas del servicio
app.use('/', accountsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// Manejador de errores centralizado
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[accounts-service] error:', err);
  res.status(500).json({ error: 'internal_error' });
});

module.exports = app;
