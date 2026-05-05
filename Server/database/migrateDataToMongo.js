require('dotenv').config();

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const { connectDatabase } = require('../src/config/database');
const { registeredUsers } = require('../src/store/registeredUsers');
const { events } = require('../src/store/events');
const { registrations } = require('../src/store/registrations');
const { feedback } = require('../src/store/feedback');
const { messages } = require('../src/store/messages');
const { notifications } = require('../src/store/notifications');
const { emailLogs } = require('../src/store/emailLogs');
const { paymentPreferences } = require('../src/store/paymentPreferences');
const { paymentTransactions } = require('../src/store/paymentTransactions');
const { newsletterSubscriptions } = require('../src/store/newsletterSubscriptions');
const { userHistoryReports } = require('../src/store/userHistory');
const { stats } = require('../src/store/stats');
const adminSettings = require('../src/store/adminSettings.json');

const PASSWORD_SALT_ROUNDS = 10;

const isBcryptHash = (value = '') =>
  typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);

const normalizeId = (value) => String(value);

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const replaceCollection = async (name, documents, indexes = []) => {
  const collection = mongoose.connection.db.collection(name);
  await collection.deleteMany({});

  if (documents.length) {
    await collection.insertMany(documents, { ordered: false });
  }

  for (const [keys, options] of indexes) {
    await collection.createIndex(keys, options);
  }
};

const buildUsers = async () =>
  Promise.all(
    registeredUsers.map(async (user) => ({
      sourceId: normalizeId(user.id),
      name: user.name,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      email: String(user.email).toLowerCase(),
      password: isBcryptHash(user.password)
        ? user.password
        : await bcrypt.hash(user.password, PASSWORD_SALT_ROUNDS),
      role: user.role || 'user',
      status: user.status || 'active',
      avatar: user.avatar || null,
      phone: user.phone || null,
      studentId: user.studentId || null,
      course: user.course || null,
      campus: user.campus || null,
      yearLevel: user.yearLevel || null,
      department: user.department || null,
      position: user.position || null,
      dateOfBirth: user.dateOfBirth || null,
      address: user.address || null,
      bio: user.bio || null,
      emergencyContact: user.emergencyContact || null,
      interests: Array.isArray(user.interests) ? user.interests : [],
      preferences: user.preferences || {},
      createdAt: parseDate(user.createdAt),
      updatedAt: parseDate(user.updatedAt || user.createdAt),
      lastLoginAt: parseDate(user.lastLoginAt),
    })),
  );

const buildEvents = () =>
  events.map((event) => ({
    sourceId: normalizeId(event.id),
    title: event.title,
    description: event.description || '',
    date: event.date || '',
    dateLabel: event.dateLabel || null,
    time: event.time || '',
    venue: event.venue || null,
    location: event.location || null,
    category: event.category || null,
    capacity: Number(event.capacity || 0),
    registrations: Number(event.registrations || 0),
    isPaid: Boolean(event.isPaid),
    price: Number(event.price || 0),
    tags: Array.isArray(event.tags) ? event.tags : [],
    organizerId: event.organizerId || null,
    organizerName: event.organizerName || null,
    organizerEmail: event.organizerEmail || null,
    status: event.status || null,
    createdAt: parseDate(event.createdAt),
    updatedAt: parseDate(event.updatedAt),
    image: event.image || null,
    imagePreview: event.imagePreview || null,
    attendees: Array.isArray(event.attendees)
      ? event.attendees.map((attendee) => ({
          sourceId: normalizeId(attendee.id),
          userName: attendee.userName || null,
          userEmail: attendee.userEmail || null,
          registrationDate: attendee.registrationDate || null,
          paymentStatus: attendee.paymentStatus || null,
          attendanceStatus: attendee.attendanceStatus || null,
        }))
      : [],
  }));

const run = async () => {
  await connectDatabase();

  const users = await buildUsers();

  await replaceCollection('users', users, [
    [{ sourceId: 1 }, { unique: true }],
    [{ email: 1 }, { unique: true }],
    [{ role: 1 }, {}],
    [{ status: 1 }, {}],
  ]);

  await replaceCollection('events', buildEvents(), [
    [{ sourceId: 1 }, { unique: true }],
    [{ status: 1 }, {}],
    [{ category: 1 }, {}],
    [{ organizerEmail: 1 }, {}],
    [{ date: 1 }, {}],
  ]);

  await replaceCollection(
    'registrations',
    registrations.map((registration) => ({
      sourceId: normalizeId(registration.id),
      eventId: normalizeId(registration.eventId),
      userName: registration.userName || null,
      userEmail: registration.userEmail || null,
      registrationDate: registration.registrationDate || null,
      paymentStatus: registration.paymentStatus || null,
      attendanceStatus: registration.attendanceStatus || null,
    })),
    [
      [{ sourceId: 1 }, { unique: true }],
      [{ eventId: 1 }, {}],
      [{ userEmail: 1 }, {}],
    ],
  );

  await replaceCollection(
    'feedback',
    feedback.map((item) => ({
      sourceId: normalizeId(item.id),
      eventId: normalizeId(item.eventId),
      eventTitle: item.eventTitle || null,
      userId: item.userId || null,
      userEmail: item.userEmail || null,
      organizerId: item.organizerId || null,
      organizerEmail: item.organizerEmail || null,
      userName: item.userName || null,
      comment: item.comment || '',
      rating: Number(item.rating || 0),
      dateSubmitted: parseDate(item.dateSubmitted),
      isAnonymous: Boolean(item.isAnonymous),
    })),
    [
      [{ sourceId: 1 }, { unique: true }],
      [{ eventId: 1 }, {}],
      [{ userEmail: 1 }, {}],
      [{ organizerEmail: 1 }, {}],
    ],
  );

  await replaceCollection(
    'messages',
    messages.map((item) => ({
      sourceId: normalizeId(item.id),
      senderEmail: item.senderEmail || null,
      senderName: item.senderName || null,
      senderRole: item.senderRole || null,
      recipientEmail: item.recipientEmail || null,
      recipientName: item.recipientName || null,
      recipientRole: item.recipientRole || null,
      subject: item.subject || '',
      body: item.body || '',
      sentAt: parseDate(item.sentAt),
      isRead: Boolean(item.isRead),
      relatedEntityType: item.relatedEntityType || null,
      relatedEntityId:
        item.relatedEntityId === null || item.relatedEntityId === undefined
          ? null
          : normalizeId(item.relatedEntityId),
    })),
    [
      [{ sourceId: 1 }, { unique: true }],
      [{ senderEmail: 1 }, {}],
      [{ recipientEmail: 1 }, {}],
      [{ sentAt: -1 }, {}],
    ],
  );

  await replaceCollection(
    'notifications',
    notifications.map((item) => ({
      sourceId: normalizeId(item.id),
      userEmail: item.userEmail || null,
      role: item.role || null,
      type: item.type || null,
      title: item.title || '',
      message: item.message || '',
      body: item.body || '',
      isRead: Boolean(item.isRead),
      createdAt: parseDate(item.createdAt),
      from: item.from || null,
      fromEmail: item.fromEmail || null,
      relatedEntityType: item.relatedEntityType || null,
      relatedEntityId:
        item.relatedEntityId === null || item.relatedEntityId === undefined
          ? null
          : normalizeId(item.relatedEntityId),
    })),
    [
      [{ sourceId: 1 }, { unique: true }],
      [{ userEmail: 1 }, {}],
      [{ role: 1 }, {}],
      [{ createdAt: -1 }, {}],
    ],
  );

  await replaceCollection(
    'email_logs',
    emailLogs.map((item) => ({
      sourceId: normalizeId(item.id),
      organizerEmail: item.organizerEmail || null,
      eventId: normalizeId(item.eventId),
      eventTitle: item.eventTitle || null,
      audience: item.audience || null,
      recipient: item.recipient || null,
      recipientCount: Number(item.recipientCount || 0),
      subject: item.subject || '',
      body: item.body || '',
      status: item.status || null,
      sentAt: parseDate(item.sentAt),
      senderName: item.senderName || null,
    })),
    [
      [{ sourceId: 1 }, { unique: true }],
      [{ organizerEmail: 1 }, {}],
      [{ eventId: 1 }, {}],
      [{ sentAt: -1 }, {}],
    ],
  );

  await replaceCollection(
    'payment_preferences',
    paymentPreferences.map((item) => ({
      sourceId: normalizeId(item.id),
      userEmail: item.userEmail || null,
      preferredMethod: item.preferredMethod || null,
      cardBrand: item.cardBrand || null,
      cardholderName: item.cardholderName || null,
      lastFourDigits: item.lastFourDigits || null,
      expiryMonth: item.expiryMonth || null,
      expiryYear: item.expiryYear || null,
      billingPostcode: item.billingPostcode || null,
      rememberPreference: Boolean(item.rememberPreference),
      createdAt: parseDate(item.createdAt),
      updatedAt: parseDate(item.updatedAt),
    })),
    [
      [{ sourceId: 1 }, { unique: true }],
      [{ userEmail: 1 }, { unique: true }],
    ],
  );

  await replaceCollection(
    'payment_transactions',
    paymentTransactions.map((item) => ({
      sourceId: normalizeId(item.id),
      receiptId: item.receiptId || null,
      stripeSessionId: item.stripeSessionId || null,
      eventId: normalizeId(item.eventId),
      eventTitle: item.eventTitle || null,
      userEmail: item.userEmail || null,
      userName: item.userName || null,
      amount: Number(item.amount || 0),
      currency: item.currency || 'AUD',
      paymentMethod: item.paymentMethod || null,
      paymentStatus: item.paymentStatus || null,
      paidAt: parseDate(item.paidAt),
      billingPostcode: item.billingPostcode || null,
      cardholderName: item.cardholderName || null,
      lastFourDigits: item.lastFourDigits || null,
    })),
    [
      [{ sourceId: 1 }, { unique: true }],
      [{ receiptId: 1 }, {}],
      [{ stripeSessionId: 1 }, { sparse: true }],
      [{ userEmail: 1 }, {}],
      [{ eventId: 1 }, {}],
      [{ paidAt: -1 }, {}],
    ],
  );

  await replaceCollection(
    'newsletter_subscriptions',
    newsletterSubscriptions.map((item) => ({
      email: String(item.email || '').toLowerCase(),
      createdAt: parseDate(item.createdAt) || new Date(),
    })),
    [[{ email: 1 }, { unique: true }]],
  );

  await replaceCollection(
    'user_history_reports',
    userHistoryReports.map((item) => ({
      sourceId: normalizeId(item.id),
      userName: item.userName || null,
      userEmail: item.userEmail || null,
      riskLevel: item.riskLevel || null,
      eventPhase: item.eventPhase || null,
      eventId:
        item.eventId === null || item.eventId === undefined
          ? null
          : normalizeId(item.eventId),
      eventTitle: item.eventTitle || null,
      reason: item.reason || '',
      reportedByName: item.reportedByName || null,
      reportedByEmail: item.reportedByEmail || null,
      reporterRole: item.reporterRole || null,
      createdAt: parseDate(item.createdAt),
    })),
    [
      [{ sourceId: 1 }, { unique: true }],
      [{ userEmail: 1 }, {}],
      [{ createdAt: -1 }, {}],
    ],
  );

  await replaceCollection(
    'admin_settings',
    [{ key: 'default', ...adminSettings }],
    [[{ key: 1 }, { unique: true }]],
  );

  await replaceCollection(
    'stats',
    [{ key: 'default', ...stats }],
    [[{ key: 1 }, { unique: true }]],
  );

  console.log('MongoDB migration completed successfully.');
  console.log(
    JSON.stringify(
      {
        users: users.length,
        events: events.length,
        registrations: registrations.length,
        feedback: feedback.length,
        messages: messages.length,
        notifications: notifications.length,
        emailLogs: emailLogs.length,
        paymentPreferences: paymentPreferences.length,
        paymentTransactions: paymentTransactions.length,
        newsletterSubscriptions: newsletterSubscriptions.length,
        userHistoryReports: userHistoryReports.length,
        adminSettings: 1,
        stats: 1,
      },
      null,
      2,
    ),
  );
};

run()
  .catch((error) => {
    console.error('MongoDB migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
