const {
  createUser,
  findUserByCredentials,
  findUserByEmail,
  sanitizeUser,
  generateOTP,
  sendOTPEmail,
  storeOTP,
  verifyOTP,
} = require('../services/authService');
const {
  validateLoginPayload,
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
  });
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

  // OTP verified, create the user
  const user = createUser({ name, email, password });

  return res.status(201).json({ 
    message: 'Account created successfully',
    user,
  });
};

module.exports = {
  login,
  signup,
};
