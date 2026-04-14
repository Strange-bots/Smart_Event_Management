const {
  createUser,
  findUserByCredentials,
  findUserByEmail,
  sanitizeUser,
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
  const { name, email, password, confirmPassword } = req.body ?? {};
  const validationError = validateSignupPayload({
    name,
    email,
    password,
    confirmPassword,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const existingUser = findUserByEmail(email);

  if (existingUser) {
    return res
      .status(409)
      .json({ message: 'An account with this email already exists' });
  }

  const user = createUser({ name, email, password });

  return res.status(201).json({ user });
};

module.exports = {
  login,
  signup,
};
