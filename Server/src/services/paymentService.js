const { notifications } = require('../store/notifications');
const { paymentTransactions } = require('../store/paymentTransactions');
const { registrations } = require('../store/registrations');
const { persistCollection } = require('../store/mongoSync');
const { findUserByEmail, sanitizeUser } = require('./authService');
const {
  createRegistrationRecord,
  getRegistrationCountForEvent,
  validateRegistrationAvailability,
} = require('./registrationService');

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const clientBaseUrl = process.env.CLIENT_APP_URL || 'http://localhost:5173';

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments.',
      statusCode: 500,
    };
  }

  try {
    // Lazy load so the server can still boot if Stripe isn't installed yet.
    const Stripe = require('stripe');

    return {
      client: new Stripe(process.env.STRIPE_SECRET_KEY),
    };
  } catch {
    return {
      error: 'Stripe SDK is not installed on the server.',
      statusCode: 500,
    };
  }
};

const formatPaymentDate = (dateString) => {
  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
};

const generateReceiptId = () =>
  `RCP-${new Date().getFullYear()}-${String(paymentTransactions.length + 1).padStart(3, '0')}`;

const sanitizeTransaction = (transaction) => ({
  id: transaction.id,
  receiptId: transaction.receiptId,
  stripeSessionId: transaction.stripeSessionId || null,
  eventId: transaction.eventId,
  eventTitle: transaction.eventTitle,
  amount: transaction.amount,
  currency: transaction.currency,
  paymentMethod: transaction.paymentMethod,
  paymentStatus: transaction.paymentStatus,
  paidAt: transaction.paidAt,
  paymentDate: formatPaymentDate(transaction.paidAt),
});

const buildStripeCheckoutSessionParams = ({ event, user }) => ({
  mode: 'payment',
  customer_email: user.email,
  success_url: `${clientBaseUrl}/payment?eventId=${encodeURIComponent(
    event.id,
  )}&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${clientBaseUrl}/payment?eventId=${encodeURIComponent(
    event.id,
  )}&checkout=cancel`,
  billing_address_collection: 'required',
  line_items: [
    {
      quantity: 1,
      price_data: {
        currency: 'aud',
        unit_amount: Math.round(Number(event.price || 0) * 100),
        product_data: {
          name: event.title,
          description: event.description,
        },
      },
    },
  ],
  metadata: {
    eventId: String(event.id),
    userEmail: user.email,
  },
});

const findExistingTransactionBySessionId = (sessionId) =>
  paymentTransactions.find(
    (transaction) => transaction.stripeSessionId === sessionId,
  );

const findExistingRegistration = ({ eventId, userEmail }) =>
  registrations.find(
    (registration) =>
      String(registration.eventId) === String(eventId) &&
      normalizeEmail(registration.userEmail) === normalizeEmail(userEmail) &&
      registration.attendanceStatus !== 'cancelled',
  );

const createStripeCheckoutSession = async ({ userEmail, eventId }) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  if (user.role !== 'user') {
    return {
      error: 'Only users can register for paid events',
      statusCode: 403,
    };
  }

  const availability = validateRegistrationAvailability({
    eventId,
    userEmail: user.email,
  });

  if (availability.error) {
    return availability;
  }

  const event = availability.event;

  if (!event.isPaid || Number(event.price || 0) <= 0) {
    return {
      error: 'This event does not require payment',
      statusCode: 400,
    };
  }

  const stripeResult = getStripeClient();

  if (stripeResult.error) {
    return stripeResult;
  }

  let session;

  try {
    session = await stripeResult.client.checkout.sessions.create(
      buildStripeCheckoutSessionParams({ event, user }),
    );
  } catch {
    return {
      error: 'Unable to create Stripe checkout session right now',
      statusCode: 502,
    };
  }

  return {
    statusCode: 201,
    checkoutUrl: session.url,
    sessionId: session.id,
    event: {
      id: event.id,
      title: event.title,
      price: Number(event.price || 0),
    },
  };
};

const confirmStripeCheckoutSession = async ({ userEmail, sessionId }) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  if (user.role !== 'user') {
    return {
      error: 'Only users can register for paid events',
      statusCode: 403,
    };
  }

  if (!sessionId) {
    return {
      error: 'Stripe session ID is required',
      statusCode: 400,
    };
  }

  const existingTransaction = findExistingTransactionBySessionId(sessionId);

  if (existingTransaction) {
    if (normalizeEmail(existingTransaction.userEmail) !== normalizeEmail(user.email)) {
      return {
        error: 'This Stripe checkout session does not belong to the current user',
        statusCode: 403,
      };
    }

    return {
      statusCode: 200,
      user: sanitizeUser(user),
      registration:
        findExistingRegistration({
          eventId: existingTransaction.eventId,
          userEmail: user.email,
        }) || null,
      receipt: sanitizeTransaction(existingTransaction),
      event: {
        id: existingTransaction.eventId,
        title: existingTransaction.eventTitle,
      },
    };
  }

  const stripeResult = getStripeClient();

  if (stripeResult.error) {
    return stripeResult;
  }

  let session;

  try {
    session = await stripeResult.client.checkout.sessions.retrieve(sessionId);
  } catch {
    return {
      error: 'Stripe checkout session could not be found',
      statusCode: 404,
    };
  }

  if (session.payment_status !== 'paid') {
    return {
      error: 'Payment has not been completed for this checkout session',
      statusCode: 409,
    };
  }

  const sessionUserEmail = normalizeEmail(
    session.metadata?.userEmail || session.customer_email || '',
  );

  if (sessionUserEmail !== normalizeEmail(user.email)) {
    return {
      error: 'This Stripe checkout session does not belong to the current user',
      statusCode: 403,
    };
  }

  const eventId = session.metadata?.eventId;

  if (!eventId) {
    return {
      error: 'Stripe session is missing event details',
      statusCode: 400,
    };
  }

  const availability = validateRegistrationAvailability({
    eventId,
    userEmail: user.email,
  });

  if (availability.error) {
    return availability;
  }

  const event = availability.event;
  const paidAt = new Date().toISOString();
  const transaction = {
    id: `txn-${event.id}-${Date.now()}`,
    receiptId: generateReceiptId(),
    stripeSessionId: session.id,
    eventId: event.id,
    eventTitle: event.title,
    userEmail: user.email,
    userName: user.name,
    amount: Number(event.price || 0),
    currency: 'AUD',
    paymentMethod: 'Stripe Checkout',
    paymentStatus: 'paid',
    paidAt,
    billingPostcode: session.customer_details?.address?.postal_code || '',
    cardholderName: session.customer_details?.name || user.name,
    lastFourDigits: null,
  };

  paymentTransactions.unshift(transaction);

  const registration = await createRegistrationRecord({
    event,
    user,
    paymentStatus: 'paid',
  });
  event.registrations = getRegistrationCountForEvent(event.id);

  notifications.unshift({
    id: `notif-payment-${Date.now()}`,
    userEmail: user.email,
    role: user.role,
    type: 'payment',
    title: 'Payment Confirmed',
    message: `Your payment for '${event.title}' was successful and your registration is confirmed.`,
    body: `Your payment for '${event.title}' was successful and your registration is confirmed.`,
    isRead: false,
    createdAt: paidAt,
    from: 'Smart Events',
    fromEmail: 'no-reply@smartevents.local',
    relatedEntityType: 'registration',
    relatedEntityId: registration.id,
  });
  await persistCollection('paymentTransactions');
  await persistCollection('notifications');
  await persistCollection('events');

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    registration,
    receipt: sanitizeTransaction(transaction),
    event: {
      id: event.id,
      title: event.title,
      registrations: event.registrations,
      capacity: event.capacity,
    },
  };
};

const listUserPaymentTransactions = (userEmail) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  const receipts = paymentTransactions
    .filter((transaction) => normalizeEmail(transaction.userEmail) === normalizeEmail(user.email))
    .sort((left, right) => new Date(right.paidAt) - new Date(left.paidAt))
    .map(sanitizeTransaction);

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    receipts,
  };
};

module.exports = {
  confirmStripeCheckoutSession,
  createStripeCheckoutSession,
  listUserPaymentTransactions,
};
