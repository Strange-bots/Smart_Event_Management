const {
  deletePaymentPreferenceForUser,
  getPaymentPreferenceForUser,
  savePaymentPreferenceForUser,
} = require('../services/paymentPreferenceService');

const getMyPaymentPreference = (req, res) => {
  const result = getPaymentPreferenceForUser(req.user?.email);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Payment preference fetched successfully',
    user: result.user,
    paymentPreference: result.paymentPreference,
  });
};

const upsertMyPaymentPreference = async (req, res) => {
  const result = await savePaymentPreferenceForUser(req.user?.email, req.body);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(result.statusCode).json({
    message:
      result.statusCode === 201
        ? 'Payment preference created successfully'
        : 'Payment preference updated successfully',
    user: result.user,
    paymentPreference: result.paymentPreference,
  });
};

const deleteMyPaymentPreference = async (req, res) => {
  const result = await deletePaymentPreferenceForUser(req.user?.email);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Payment preference deleted successfully',
    user: result.user,
  });
};

module.exports = {
  deleteMyPaymentPreference,
  getMyPaymentPreference,
  upsertMyPaymentPreference,
};
