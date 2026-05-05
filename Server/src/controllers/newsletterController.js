const {
  createNewsletterSubscription,
} = require('../services/newsletterService');

const subscribeToNewsletter = async (req, res) => {
  const { email } = req.body ?? {};
  const result = await createNewsletterSubscription(email);

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
