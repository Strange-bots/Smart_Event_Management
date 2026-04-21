const {
  createNewsletterSubscription,
} = require('../services/newsletterService');

const subscribeToNewsletter = (req, res) => {
  const { email } = req.body ?? {};
  const result = createNewsletterSubscription(email);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(201).json({
    message: 'Subscription successful',
    subscription: result.subscription,
  });
};

module.exports = {
  subscribeToNewsletter,
};
