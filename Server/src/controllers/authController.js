const User = require('../models/User');
const { isDatabaseAvailable } = require('../config/database');
const {
  createUser,
  createSessionToken,
  findUserByCredentials,
  findUserByEmail,
  sanitizeUser,
  updateUserProfile,
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
  validateForgotPasswordRequestPayload,
  validateForgotPasswordResetPayload,
  validateLoginPayload,
  validateProfileUpdatePayload,
  validateSecureSignupPayload,
  validateSignupPayload,
} = require('../validators/authValidator');

const login = async (req, res) => {
  const { email, password } = req.body ?? {};
  const validationError = validateLoginPayload({ email, password });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const matchedUser = await findUserByCredentials(email, password);

  if (!matchedUser) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    user: sanitizeUser(matchedUser),
    token: createSessionToken(matchedUser),
  });
};

const getCurrentUserProfile = async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const user = await verifySessionToken(token);

  if (!user) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  return res.status(200).json({
    user: (({ password, ...profile }) => profile)(user),
  });
};

const authorizeDashboard = async (req, res) => {
  const { role } = req.body ?? {};
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!role) {
    return res.status(400).json({ message: 'Role is required' });
  }

  const user = await verifySessionToken(token);

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

    await User.create({
      name: sanitizedPayload.name,
      email: sanitizedPayload.email,
      password: sanitizedPayload.password,
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

const signup = async (req, res) => {
  try {
    const {
      email,
      otp,
      name,
      password,
      confirmPassword,
      acceptedTerms,
    } = req.body ?? {};

    if (!otp) {
      const validationError = validateSignupPayload({
        name,
        email,
        password,
        confirmPassword,
        acceptedTerms,
      });

      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      if (await findUserByEmail(email)) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      const generatedOTP = generateOTP();

      storeOTP(email, generatedOTP);

      try {
        const deliveryResult = await sendOTPEmail(email, generatedOTP);
        const response = {
          message: 'OTP sent successfully. Please verify your email to complete registration.',
          email,
          requiresOtp: true,
        };

        if (deliveryResult?.preview) {
          response.previewOtp = deliveryResult.preview;
        }

        return res.status(200).json(response);
      } catch (error) {
        console.error('Failed to send OTP email:', error.message);
        return res.status(500).json({
          message: 'Failed to send OTP email. Please try again.',
        });
      }
    }

    if (!email || !otp || !name || !password) {
      return res.status(400).json({ message: 'Email, OTP, name, and password are required' });
    }

    const validationError = validateSignupPayload({
      name,
      email,
      password,
      confirmPassword,
      acceptedTerms,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (await findUserByEmail(email)) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const isValidOTP = verifyOTP(email, otp);

    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await createUser({
      name,
      email,
      password,
      acceptedTermsAt: new Date().toISOString(),
    });
    const createdUser = await findUserByEmail(user.email);

    return res.status(201).json({
      message: 'Account created successfully',
      user,
      token: createSessionToken(createdUser),
    });
  } catch (error) {
    console.error('Signup request failed:', error.message);

    return res.status(500).json({
      message: 'Unable to complete signup right now',
    });
  }
};

const changePassword = async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const sessionUser = await verifySessionToken(token);

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

  const matchedUser = await findUserByCredentials(
    sessionUser.email,
    currentPassword,
  );

  if (!matchedUser) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  await updateUserPassword({
    email: sessionUser.email,
    newPassword,
  });

  const refreshedUser = await findUserByEmail(sessionUser.email);

  return res.status(200).json({
    message: 'Password updated successfully',
    user: sanitizeUser(refreshedUser),
  });
};

const requestPasswordResetOtp = async (req, res) => {
  const { email } = req.body ?? {};
  const validationError = validateForgotPasswordRequestPayload({ email });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(404).json({ message: 'No account found for this email address' });
  }

  const generatedOTP = generateOTP();
  storeOTP(email, generatedOTP, 'password-reset');

  try {
    const deliveryResult = await sendOTPEmail(email, generatedOTP, {
      purpose: 'password-reset',
    });
    const response = {
      message: 'OTP sent successfully. Please verify the code to reset your password.',
      email,
      requiresOtp: true,
    };

    if (deliveryResult?.preview) {
      response.previewOtp = deliveryResult.preview;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Failed to send password reset OTP email:', error.message);
    return res.status(500).json({
      message: 'Failed to send OTP email. Please try again.',
    });
  }
};

const resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body ?? {};
  const validationError = validateForgotPasswordResetPayload({
    email,
    otp,
    newPassword,
    confirmPassword,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(404).json({ message: 'No account found for this email address' });
  }

  const isValidOtp = verifyOTP(email, otp, 'password-reset');

  if (!isValidOtp) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  await updateUserPassword({
    email,
    newPassword,
  });

  return res.status(200).json({
    message: 'Password reset successfully. You can sign in with your new password.',
  });
};

const updateMyProfile = async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const sessionUser = await verifySessionToken(token);

  if (!sessionUser) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  const { name, phone } = req.body ?? {};
  const validationError = validateProfileUpdatePayload({ name, phone });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const result = await updateUserProfile({
    currentEmail: sessionUser.email,
    name,
    phone,
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  const refreshedUser = await findUserByEmail(sessionUser.email);

  return res.status(200).json({
    message: 'Profile updated successfully',
    user: result.user,
    token: createSessionToken(refreshedUser),
  });
};

module.exports = {
  authorizeDashboard,
  changePassword,
  getCurrentUserProfile,
  login,
  requestPasswordResetOtp,
  registerUser,
  resetPasswordWithOtp,
  signup,
  updateMyProfile,
};
