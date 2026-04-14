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

const verifyOTP = (req, res) => {
  const { email, otp, name, password } = req.body ?? {};

  if (!email || !otp || !name || !password) {
    return res.status(400).json({ message: 'Email, OTP, name, and password are required' });
  }

  const isValidOTP = verifyOTP(email, otp);

  if (!isValidOTP) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // OTP verified, create the user
  const user = createUser({ name, email, password });

  return res.status(201).json({ 
    message: 'Account created successfully',
    user 
  });
};

module.exports = {
  login,
  signup,
  verifyOTP,
};
