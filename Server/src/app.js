const express = require('express');
const path = require('path');
const apiRoutes = require('./routes');
const corsMiddleware = require('./middleware/cors');

const app = express();

app.use(express.json({ limit: '6mb' }));
app.use(corsMiddleware);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Smart Event Management backend is running',
  });
});
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});
app.use('/api', apiRoutes);

module.exports = app;
