const mongoose = require('mongoose');

const { isDatabaseAvailable } = require('../config/database');
const { adminUserSeed } = require('../../database/seeds/adminUserSeed');

const DEFINITIONS = {
  users: {
    collectionName: 'users',
    seed: [adminUserSeed],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      sourceId: undefined,
      _id: undefined,
    }),
  },
  events: {
    collectionName: 'events',
    seed: [],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      attendees: Array.isArray(item.attendees)
        ? item.attendees.map((attendee) => ({
            ...attendee,
            sourceId: String(attendee.id),
            id: undefined,
          }))
        : [],
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      attendees: Array.isArray(item.attendees)
        ? item.attendees.map((attendee) => ({
            ...attendee,
            id: attendee.sourceId || attendee.id,
            sourceId: undefined,
            _id: undefined,
          }))
        : [],
      sourceId: undefined,
      _id: undefined,
    }),
  },
  registrations: {
    collectionName: 'registrations',
    seed: [],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      sourceId: undefined,
      _id: undefined,
    }),
  },
  feedback: {
    collectionName: 'feedback',
    seed: [],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      sourceId: undefined,
      _id: undefined,
    }),
  },
  messages: {
    collectionName: 'messages',
    seed: [],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      sourceId: undefined,
      _id: undefined,
    }),
  },
  notifications: {
    collectionName: 'notifications',
    seed: [],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      sourceId: undefined,
      _id: undefined,
    }),
  },
  emailLogs: {
    collectionName: 'email_logs',
    seed: [],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      sourceId: undefined,
      _id: undefined,
    }),
  },
  paymentPreferences: {
    collectionName: 'payment_preferences',
    seed: [],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      sourceId: undefined,
      _id: undefined,
    }),
  },
  paymentTransactions: {
    collectionName: 'payment_transactions',
    seed: [],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      sourceId: undefined,
      _id: undefined,
    }),
  },
  newsletterSubscriptions: {
    collectionName: 'newsletter_subscriptions',
    seed: [],
    toDatabase: (item) => item,
    fromDatabase: (item) => ({ ...item, _id: undefined }),
  },
  userHistoryReports: {
    collectionName: 'user_history_reports',
    seed: [],
    toDatabase: (item) => ({
      ...item,
      sourceId: String(item.id),
      id: undefined,
    }),
    fromDatabase: (item) => ({
      ...item,
      id: item.sourceId || item.id,
      sourceId: undefined,
      _id: undefined,
    }),
  },
  adminSettings: {
    collectionName: 'admin_settings',
    seed: null,
    singleton: true,
    key: 'default',
    toDatabase: (item) => ({
      key: 'default',
      ...item,
    }),
    fromDatabase: (item) => {
      const { _id, key, ...rest } = item;
      return rest;
    },
  },
  stats: {
    collectionName: 'stats',
    seed: null,
    singleton: true,
    key: 'default',
    toDatabase: (item) => ({
      key: 'default',
      ...item,
    }),
    fromDatabase: (item) => {
      const { _id, key, ...rest } = item;
      return rest;
    },
  },
};

const ensureDatabase = () => {
  if (!isDatabaseAvailable()) {
    throw new Error('MongoDB is not available');
  }
};

const getCollection = (key) => {
  ensureDatabase();
  return mongoose.connection.db.collection(DEFINITIONS[key].collectionName);
};

const seedCollectionIfEmpty = async (key) => {
  const definition = DEFINITIONS[key];
  const collection = getCollection(key);
  const count = await collection.countDocuments();

  if (count > 0 || definition.seed == null) {
    return;
  }

  if (definition.singleton) {
    await collection.insertOne(definition.toDatabase(definition.seed));
    return;
  }

  if (definition.seed.length) {
    await collection.insertMany(definition.seed.map(definition.toDatabase));
  }
};

const readCollection = async (key) => {
  const definition = DEFINITIONS[key];
  await seedCollectionIfEmpty(key);

  if (definition.singleton) {
    const document = await getCollection(key).findOne({ key: definition.key });
    return document ? definition.fromDatabase(document) : null;
  }

  const documents = await getCollection(key).find({}).toArray();
  return documents.map(definition.fromDatabase);
};

const writeCollection = async (key, value) => {
  const definition = DEFINITIONS[key];
  const collection = getCollection(key);

  if (definition.singleton) {
    await collection.replaceOne(
      { key: definition.key },
      definition.toDatabase(value),
      { upsert: true },
    );
    return value;
  }

  await collection.deleteMany({});

  if (Array.isArray(value) && value.length) {
    await collection.insertMany(value.map(definition.toDatabase));
  }

  return value;
};

module.exports = {
  readCollection,
  writeCollection,
};
