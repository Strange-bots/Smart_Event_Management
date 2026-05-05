use("smart_event_management");

// Connect your MongoDB Playground / Compass session to:
// mongodb+srv://thapasachin739_db_user:3Zw5DECFSX4hSzYN@eventmanagementkoi.bkrd6ax.mongodb.net/?retryWrites=true&w=majority&appName=EventManagementKOI

const collections = [
  "users",
  "events",
  "registrations",
  "feedback",
  "messages",
  "notifications",
  "email_logs",
  "payment_preferences",
  "payment_transactions",
  "newsletter_subscriptions",
  "user_history_reports",
  "admin_settings",
  "stats",
];

collections.forEach((name) => {
  const exists = db.getCollectionInfos({ name }).length > 0;

  if (!exists) {
    db.createCollection(name);
    print(`Created collection: ${name}`);
  } else {
    print(`Collection already exists: ${name}`);
  }
});

db.users.createIndex({ sourceId: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ status: 1 });

db.events.createIndex({ sourceId: 1 }, { unique: true });
db.events.createIndex({ status: 1 });
db.events.createIndex({ category: 1 });
db.events.createIndex({ organizerEmail: 1 });
db.events.createIndex({ date: 1 });

db.registrations.createIndex({ sourceId: 1 }, { unique: true });
db.registrations.createIndex({ eventId: 1 });
db.registrations.createIndex({ userEmail: 1 });

db.feedback.createIndex({ sourceId: 1 }, { unique: true });
db.feedback.createIndex({ eventId: 1 });
db.feedback.createIndex({ userEmail: 1 });
db.feedback.createIndex({ organizerEmail: 1 });

db.messages.createIndex({ sourceId: 1 }, { unique: true });
db.messages.createIndex({ senderEmail: 1 });
db.messages.createIndex({ recipientEmail: 1 });
db.messages.createIndex({ sentAt: -1 });

db.notifications.createIndex({ sourceId: 1 }, { unique: true });
db.notifications.createIndex({ userEmail: 1 });
db.notifications.createIndex({ role: 1 });
db.notifications.createIndex({ createdAt: -1 });

db.email_logs.createIndex({ sourceId: 1 }, { unique: true });
db.email_logs.createIndex({ organizerEmail: 1 });
db.email_logs.createIndex({ eventId: 1 });
db.email_logs.createIndex({ sentAt: -1 });

db.payment_preferences.createIndex({ sourceId: 1 }, { unique: true });
db.payment_preferences.createIndex({ userEmail: 1 }, { unique: true });

db.payment_transactions.createIndex({ sourceId: 1 }, { unique: true });
db.payment_transactions.createIndex({ receiptId: 1 });
db.payment_transactions.createIndex({ stripeSessionId: 1 }, { sparse: true });
db.payment_transactions.createIndex({ userEmail: 1 });
db.payment_transactions.createIndex({ eventId: 1 });
db.payment_transactions.createIndex({ paidAt: -1 });

db.newsletter_subscriptions.createIndex({ email: 1 }, { unique: true });

db.user_history_reports.createIndex({ sourceId: 1 }, { unique: true });
db.user_history_reports.createIndex({ userEmail: 1 });
db.user_history_reports.createIndex({ createdAt: -1 });

db.admin_settings.createIndex({ key: 1 }, { unique: true });
db.stats.createIndex({ key: 1 }, { unique: true });

print("Cluster database setup complete for smart_event_management.");
