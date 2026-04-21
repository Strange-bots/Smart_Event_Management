const mongoose = require('mongoose');

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/smart_event_management';

const connectDatabase = async () => {
  // Reuse the existing connection during local reloads.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  return mongoose.connect(mongoUri, {
    dbName: 'smart_event_management',
  });
};

module.exports = {
  connectDatabase,
};
