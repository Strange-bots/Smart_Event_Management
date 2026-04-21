const validateLoginPayload = ({ email, password }) => {
  if (!email?.trim() || !password?.trim()) {
    return 'Email and password are required';
  }

  return null;
};

const validateSignupPayload = ({ name, email, password, confirmPassword }) => {
  if (!name?.trim()) {
    return 'Please enter your name';
  }

  if (!email?.trim()) {
    return 'Please enter your email';
  }

  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
};

module.exports = {
  validateLoginPayload,
  validateSignupPayload,
};
