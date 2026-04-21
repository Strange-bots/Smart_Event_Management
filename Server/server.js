const http = require('http');
const app = require('./src/app');

const PORT = process.env.PORT || 5001;

const startServer = () => {
  const server = http.createServer(app);

  server.on('error', (error) => {
    console.error(`Failed to start server on port ${PORT}:`, error.message);
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
