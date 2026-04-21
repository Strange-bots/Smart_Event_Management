const http = require('http');
const app = require('./src/app');
const {
  connectDatabase,
  markDatabaseUnavailable,
} = require('./src/config/database');

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  const server = http.createServer(app);

  server.on('error', (error) => {
    console.error(`Failed to start server on port ${PORT}:`, error.message);
    process.exit(1);
  });

  server.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    try {
      await connectDatabase();
      console.log('MongoDB connected successfully');
    } catch (error) {
      markDatabaseUnavailable();
      console.error('MongoDB is unavailable. Auth/contact persistence is temporarily disabled:', error.message);
    }
  });
};

startServer();
