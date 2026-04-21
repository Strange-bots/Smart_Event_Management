const http = require('http');
const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    server.on('error', (error) => {
      console.error(`Failed to start server on port ${PORT}:`, error.message);
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

startServer();
