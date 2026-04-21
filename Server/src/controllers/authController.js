const bcrypt = require('bcrypt');
const User = require('../models/User');
const { isDatabaseAvailable } = require('../config/database');
const {
  createUser,
  createSessionToken,
  findUserByCredentials,
  findUserByEmail,
  sanitizeUser,
  updateUserPassword,
  verifySessionToken,
  generateOTP,
  sendOTPEmail,
  storeOTP,
  verifyOTP,
} = require('../services/authService');
const {
  sanitizeSignupRequest,
  validateChangePasswordPayload,
  validateLoginPayload,
  validateSecureSignupPayload,
  validateSignupPayload,
} = require('../validators/authValidator');

const login = (req, res) => {
  const { email, password } = req.body ?? {};
  const validationError = validateLoginPayload({ email, password });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const matchedUser = findUserByCredentials(email, password);

  if (!matchedUser) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    user: sanitizeUser(matchedUser),
    token: createSessionToken(matchedUser),
  });
};

const authorizeDashboard = (req, res) => {
  const { role } = req.body ?? {};
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!role) {
    return res.status(400).json({ message: 'Role is required' });
  }

  const user = verifySessionToken(token);

  if (!user) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  if (user.role !== role) {
    return res.status(403).json({
      message: 'You are not authorized to access this dashboard',
      user: sanitizeUser(user),
    });
  }

  return res.status(200).json({
    authorized: true,
    user: sanitizeUser(user),
  });
};

const registerUser = async (req, res) => {
  try {
    const sanitizedPayload = sanitizeSignupRequest(req.body);
    const validationErrors = validateSecureSignupPayload(sanitizedPayload);

    if (validationErrors.length) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    if (!isDatabaseAvailable()) {
      return res.status(500).json({
        message: 'Internal server error',
      });
    }

    const existingUser = await User.findOne({ email: sanitizedPayload.email });

    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists',
      });
    }

    // Persist only a bcrypt hash so raw passwords never reach the database.
    const hashedPassword = await bcrypt.hash(sanitizedPayload.password, 10);

    await User.create({
      name: sanitizedPayload.name,
      email: sanitizedPayload.email,
      password: hashedPassword,
      role: 'user',
    });

    return res.status(201).json({
      message: 'User registered successfully',
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: 'User already exists',
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

const signup = (req, res) => {
  const { email, otp, name, password, confirmPassword } = req.body ?? {};

  if (!otp) {
    const validationError = validateSignupPayload({
      name,
      email,
      password,
      confirmPassword,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (findUserByEmail(email)) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const generatedOTP = generateOTP();

    storeOTP(email, generatedOTP);

    sendOTPEmail(email, generatedOTP)
      .then((deliveryResult) => {
        const response = {
          message: 'OTP sent successfully. Please verify your email to complete registration.',
          email,
          requiresOtp: true,
        };

        if (deliveryResult?.preview) {
          response.previewOtp = deliveryResult.preview;
        }

        return res.status(200).json(response);
      })
      .catch(() => {
        return res.status(500).json({
          message: 'Failed to send OTP email. Please try again.',
        });
      });

    return;
  }

  if (!email || !otp || !name || !password) {
    return res.status(400).json({ message: 'Email, OTP, name, and password are required' });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const isValidOTP = verifyOTP(email, otp);

  if (!isValidOTP) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const user = createUser({ name, email, password });
  const createdUser = findUserByEmail(user.email);

  return res.status(201).json({
    message: 'Account created successfully',
    user,
    token: createSessionToken(createdUser),
  });
};

const changePassword = (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const sessionUser = verifySessionToken(token);

  if (!sessionUser) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  const { currentPassword, newPassword, confirmPassword } = req.body ?? {};
  const validationError = validateChangePasswordPayload({
    currentPassword,
    newPassword,
    confirmPassword,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const matchedUser = findUserByCredentials(sessionUser.email, currentPassword);

  if (!matchedUser) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  updateUserPassword({
    email: sessionUser.email,
    newPassword,
  });

  return res.status(200).json({
    message: 'Password updated successfully',
    user: sanitizeUser(findUserByEmail(sessionUser.email)),
  });
};

module.exports = {
  authorizeDashboard,
  changePassword,
  login,
  registerUser,
  signup,
};
