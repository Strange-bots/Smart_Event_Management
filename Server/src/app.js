const express = require('express');
const path = require('path');
const apiRoutes = require('./routes');
const corsMiddleware = require('./middleware/cors');

const app = express();

app.use(express.json({ limit: '6mb' }));
app.use(corsMiddleware);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/api', apiRoutes);

module.exports = app;
