const mongoose = require('mongoose');

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/smart_event_management';
let databaseAvailable = false;

const connectDatabase = async () => {
  // Reuse the existing connection during local reloads.
  if (mongoose.connection.readyState === 1) {
    databaseAvailable = true;
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  const connection = await mongoose.connect(mongoUri, {
    dbName: 'smart_event_management',
    serverSelectionTimeoutMS: 3000,
  });

  databaseAvailable = true;

  return connection;
};

const markDatabaseUnavailable = () => {
  databaseAvailable = false;
};

const isDatabaseAvailable = () => {
  return databaseAvailable && mongoose.connection.readyState === 1;
};

module.exports = {
  connectDatabase,
  isDatabaseAvailable,
  markDatabaseUnavailable,
};
