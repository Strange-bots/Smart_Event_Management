require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const {
  connectDatabase,
  markDatabaseUnavailable,
} = require('./src/config/database');

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '127.0.0.1';

const startServer = async () => {
  const server = http.createServer(app);

  server.on('error', (error) => {
    console.error(`Failed to start server on port ${PORT}:`, error.message);
    process.exit(1);
  });

  try {
    await connectDatabase();
    console.log('MongoDB connected successfully');
  } catch (error) {
    markDatabaseUnavailable();
    console.error(
      'MongoDB is unavailable. Falling back to local seed data:',
      error.message,
    );
  }

  server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
};

startServer();
