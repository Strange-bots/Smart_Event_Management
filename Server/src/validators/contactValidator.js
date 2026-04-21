const { sanitizeString } = require('../utils/sanitizeInput');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Normalize incoming payload before validation and persistence.
const sanitizeContactPayload = (payload = {}) => ({
  name: sanitizeString(payload.name),
  email: sanitizeString(payload.email).toLowerCase(),
  message: sanitizeString(payload.message),
});

const validateContactPayload = ({ name, email, message }) => {
  const errors = [];

  if (!name) {
    errors.push({
      field: 'name',
      message: 'Name is required',
    });
  }

  if (!email) {
    errors.push({
      field: 'email',
      message: 'Email is required',
    });
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push({
      field: 'email',
      message: 'Email must be in a valid format',
    });
  }

  if (!message) {
    errors.push({
      field: 'message',
      message: 'Message is required',
    });
  } else if (message.length < 10) {
    errors.push({
      field: 'message',
      message: 'Message must be at least 10 characters long',
    });
  }

  return errors;
};

module.exports = {
  sanitizeContactPayload,
  validateContactPayload,
};
