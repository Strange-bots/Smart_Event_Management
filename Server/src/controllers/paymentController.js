const {
  confirmStripeCheckoutSession,
  createStripeCheckoutSession,
  listUserPaymentTransactions,
} = require('../services/paymentService');

const createStripeCheckout = async (req, res) => {
  const result = await createStripeCheckoutSession({
    userEmail: req.user?.email,
    eventId: req.params.eventId,
  });

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(result.statusCode).json({
    message: 'Stripe checkout session created successfully',
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
    event: result.event,
  });
};

const confirmStripeCheckout = async (req, res) => {
  const result = await confirmStripeCheckoutSession({
    userEmail: req.user?.email,
    sessionId: req.body?.sessionId,
  });

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
      registration: result.registration,
    });
  }

  return res.status(result.statusCode).json({
    message: 'Stripe payment confirmed successfully',
    user: result.user,
    registration: result.registration,
    event: result.event,
    receipt: result.receipt,
  });
};

const listMyPayments = (req, res) => {
  const result = listUserPaymentTransactions(req.user?.email);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Payments fetched successfully',
    user: result.user,
    receipts: result.receipts,
  });
};

module.exports = {
  confirmStripeCheckout,
  createStripeCheckout,
  listMyPayments,
};
