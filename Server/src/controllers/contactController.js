const Contact = require('../models/Contact');
const {
  sanitizeContactPayload,
  validateContactPayload,
} = require('../validators/contactValidator');

const createContactMessage = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeContactPayload(req.body);
    const validationErrors = validateContactPayload(sanitizedPayload);

    if (validationErrors.length) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    await Contact.create(sanitizedPayload);

    return res.status(201).json({
      message: 'Message sent successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createContactMessage,
};
