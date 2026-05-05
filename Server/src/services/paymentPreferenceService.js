const { paymentPreferences } = require('../store/paymentPreferences');
const { persistCollection } = require('../store/mongoSync');
const { findUserByEmail, sanitizeUser } = require('./authService');

const ALLOWED_METHODS = ['card', 'paypal', 'bank-transfer'];

const sanitizePaymentPreference = (record) => {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    userEmail: record.userEmail,
    preferredMethod: record.preferredMethod,
    cardBrand: record.cardBrand || null,
    cardholderName: record.cardholderName,
    lastFourDigits: record.lastFourDigits,
    expiryMonth: record.expiryMonth || '',
    expiryYear: record.expiryYear || '',
    billingPostcode: record.billingPostcode,
    rememberPreference: record.rememberPreference,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

const detectCardBrand = (cardNumber) => {
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(cardNumber)) {
    return 'visa';
  }

  if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7([01]\d{12}|20\d{12})))$/.test(cardNumber)) {
    return 'mastercard';
  }

  if (/^3[47]\d{13}$/.test(cardNumber)) {
    return 'amex';
  }

  return 'card';
};

const validatePayload = (payload = {}) => {
  const preferredMethod = payload.preferredMethod ? String(payload.preferredMethod).trim() : null;
  const cardholderName = payload.cardholderName ? String(payload.cardholderName).trim() : '';
  const cardNumber = payload.cardNumber ? String(payload.cardNumber).replace(/\D/g, '') : '';
  const lastFourDigits = cardNumber ? cardNumber.slice(-4) : '';
  const expiryMonth = payload.expiryMonth ? String(payload.expiryMonth).replace(/\D/g, '').slice(0, 2) : '';
  const expiryYear = payload.expiryYear ? String(payload.expiryYear).replace(/\D/g, '').slice(0, 4) : '';
  const cvv = payload.cvv ? String(payload.cvv).replace(/\D/g, '').slice(0, 4) : '';
  const billingPostcode = payload.billingPostcode ? String(payload.billingPostcode).trim() : '';
  const rememberPreference = payload.rememberPreference === true;

  if (preferredMethod && !ALLOWED_METHODS.includes(preferredMethod)) {
    return {
      error: 'Preferred payment method is invalid',
      statusCode: 400,
    };
  }

  if (rememberPreference) {
    if (!preferredMethod) {
      return {
        error: 'Preferred payment method is required when saving payment preferences',
        statusCode: 400,
      };
    }

    if (!cardholderName) {
      return {
        error: 'Cardholder name is required when saving payment preferences',
        statusCode: 400,
      };
    }

    if (preferredMethod === 'card' && !/^\d{13,19}$/.test(cardNumber)) {
      return {
        error: 'A valid card number is required',
        statusCode: 400,
      };
    }

    if (preferredMethod === 'card' && !/^(0[1-9]|1[0-2])$/.test(expiryMonth)) {
      return {
        error: 'A valid expiry month is required',
        statusCode: 400,
      };
    }

    if (preferredMethod === 'card' && !/^\d{4}$/.test(expiryYear)) {
      return {
        error: 'A valid expiry year is required',
        statusCode: 400,
      };
    }

    if (preferredMethod === 'card' && !/^\d{3,4}$/.test(cvv)) {
      return {
        error: 'A valid CVV is required',
        statusCode: 400,
      };
    }
  }

  return {
    value: {
      preferredMethod,
      cardBrand: preferredMethod === 'card' ? detectCardBrand(cardNumber) : null,
      cardholderName,
      lastFourDigits,
      expiryMonth,
      expiryYear,
      billingPostcode,
      rememberPreference,
    },
  };
};

const getPaymentPreferenceForUser = (userEmail) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  const record = paymentPreferences.find(
    (item) => item.userEmail.toLowerCase() === user.email.toLowerCase(),
  );

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    paymentPreference: sanitizePaymentPreference(record),
  };
};

const savePaymentPreferenceForUser = async (userEmail, payload) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  const validation = validatePayload(payload);

  if (validation.error) {
    return validation;
  }

  const existingRecord = paymentPreferences.find(
    (item) => item.userEmail.toLowerCase() === user.email.toLowerCase(),
  );
  const timestamp = new Date().toISOString();

  if (existingRecord) {
    existingRecord.preferredMethod = validation.value.preferredMethod;
    existingRecord.cardBrand = validation.value.cardBrand;
    existingRecord.cardholderName = validation.value.cardholderName;
    existingRecord.lastFourDigits = validation.value.lastFourDigits;
    existingRecord.expiryMonth = validation.value.expiryMonth;
    existingRecord.expiryYear = validation.value.expiryYear;
    existingRecord.billingPostcode = validation.value.billingPostcode;
    existingRecord.rememberPreference = validation.value.rememberPreference;
    existingRecord.updatedAt = timestamp;
    await persistCollection('paymentPreferences');

    return {
      statusCode: 200,
      user: sanitizeUser(user),
      paymentPreference: sanitizePaymentPreference(existingRecord),
    };
  }

  const nextRecord = {
    id: `paypref-${user.id}`,
    userEmail: user.email,
    preferredMethod: validation.value.preferredMethod,
    cardBrand: validation.value.cardBrand,
    cardholderName: validation.value.cardholderName,
    lastFourDigits: validation.value.lastFourDigits,
    expiryMonth: validation.value.expiryMonth,
    expiryYear: validation.value.expiryYear,
    billingPostcode: validation.value.billingPostcode,
    rememberPreference: validation.value.rememberPreference,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  paymentPreferences.push(nextRecord);
  await persistCollection('paymentPreferences');

  return {
    statusCode: 201,
    user: sanitizeUser(user),
    paymentPreference: sanitizePaymentPreference(nextRecord),
  };
};

const deletePaymentPreferenceForUser = async (userEmail) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  const index = paymentPreferences.findIndex(
    (item) => item.userEmail.toLowerCase() === user.email.toLowerCase(),
  );

  if (index === -1) {
    return {
      error: 'Payment preference not found',
      statusCode: 404,
    };
  }

  paymentPreferences.splice(index, 1);
  await persistCollection('paymentPreferences');

  return {
    statusCode: 200,
    user: sanitizeUser(user),
  };
};

module.exports = {
  deletePaymentPreferenceForUser,
  getPaymentPreferenceForUser,
  sanitizePaymentPreference,
  savePaymentPreferenceForUser,
};
