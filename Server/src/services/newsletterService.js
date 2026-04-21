const { newsletterSubscriptions } = require('../data/newsletterSubscriptions');

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createNewsletterSubscription = (email) => {
  if (!email?.trim()) {
    return {
      statusCode: 400,
      error: 'Email is required',
    };
  }

  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return {
      statusCode: 400,
      error: 'Please enter a valid email address',
    };
  }

  const existingSubscription = newsletterSubscriptions.find(
    (subscription) => subscription.email === normalizedEmail
  );

  if (existingSubscription) {
    return {
      statusCode: 409,
      error: 'This email is already subscribed',
    };
  }

  const subscription = {
    id: `newsletter-${Date.now()}`,
    email: normalizedEmail,
    subscribedAt: new Date().toISOString(),
  };

  newsletterSubscriptions.push(subscription);

  return {
    statusCode: 201,
    subscription,
  };
};

module.exports = {
  createNewsletterSubscription,
};
