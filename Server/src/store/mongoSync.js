const mongoose = require('mongoose');

const { isDatabaseAvailable } = require('../config/database');
const { registeredUsers } = require('./registeredUsers');
const { events } = require('./events');
const { registrations } = require('./registrations');
const { feedback } = require('./feedback');
const { messages } = require('./messages');
const { notifications } = require('./notifications');
const { emailLogs } = require('./emailLogs');
const { paymentPreferences } = require('./paymentPreferences');
const { paymentTransactions } = require('./paymentTransactions');
const { newsletterSubscriptions } = require('./newsletterSubscriptions');
const { userHistoryReports } = require('./userHistory');
const adminSettings = require('./adminSettings.json');
const { stats } = require('./stats');

const COLLECTIONS = {
  users: {
    collectionName: 'users',
    target: registeredUsers,
    singleton: false,
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
    target: events,
    singleton: false,
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
    target: registrations,
    singleton: false,
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
    target: feedback,
    singleton: false,
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
    target: messages,
    singleton: false,
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
    target: notifications,
    singleton: false,
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
    target: emailLogs,
    singleton: false,
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
    target: paymentPreferences,
    singleton: false,
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
    target: paymentTransactions,
    singleton: false,
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
    target: newsletterSubscriptions,
    singleton: false,
    toDatabase: (item) => item,
    fromDatabase: (item) => ({ ...item, _id: undefined }),
  },
  userHistoryReports: {
    collectionName: 'user_history_reports',
    target: userHistoryReports,
    singleton: false,
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
    target: adminSettings,
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
    target: stats,
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

const replaceArrayContents = (target, nextItems) => {
  target.splice(0, target.length, ...nextItems);
};

const replaceObjectContents = (target, nextValue) => {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });
  Object.assign(target, nextValue);
};

const getCollection = (collectionKey) =>
  mongoose.connection.db.collection(COLLECTIONS[collectionKey].collectionName);

const seedCollectionIfEmpty = async (collectionKey) => {
  const definition = COLLECTIONS[collectionKey];
  const collection = getCollection(collectionKey);
  const count = await collection.countDocuments();

  if (count > 0) {
    return;
  }

  if (definition.singleton) {
    await collection.insertOne(definition.toDatabase(definition.target));
    return;
  }

  if (definition.target.length) {
    await collection.insertMany(definition.target.map(definition.toDatabase));
  }
};

const hydrateCollection = async (collectionKey) => {
  const definition = COLLECTIONS[collectionKey];
  const collection = getCollection(collectionKey);

  await seedCollectionIfEmpty(collectionKey);

  if (definition.singleton) {
    const document = await collection.findOne({ key: definition.key });

    if (document) {
      replaceObjectContents(definition.target, definition.fromDatabase(document));
    }

    return;
  }

  const documents = await collection.find({}).toArray();
  replaceArrayContents(
    definition.target,
    documents.map(definition.fromDatabase),
  );
};

const hydrateMongoBackedData = async () => {
  if (!isDatabaseAvailable()) {
    return;
  }

  for (const key of Object.keys(COLLECTIONS)) {
    await hydrateCollection(key);
  }
};

const persistCollection = async (collectionKey) => {
  if (!isDatabaseAvailable()) {
    return;
  }

  const definition = COLLECTIONS[collectionKey];
  const collection = getCollection(collectionKey);

  if (definition.singleton) {
    await collection.replaceOne(
      { key: definition.key },
      definition.toDatabase(definition.target),
      { upsert: true },
    );
    return;
  }

  await collection.deleteMany({});

  if (definition.target.length) {
    await collection.insertMany(definition.target.map(definition.toDatabase));
  }
};

module.exports = {
  hydrateMongoBackedData,
  persistCollection,
};
