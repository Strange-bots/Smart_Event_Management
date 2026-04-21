const { readSettingsFromDisk } = require('../services/adminSettingsService');

const validateLoginPayload = ({ email, password }) => {
  if (!email?.trim() || !password?.trim()) {
    return 'Email and password are required';
  }

  return null;
};

const getPasswordComplexityError = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character';
  }

  return null;
};

const validatePasswordStrength = (password) => {
  const settings = readSettingsFromDisk();

  if (!settings?.security?.passwordComplexity) {
    return null;
  }

  return getPasswordComplexityError(password);
};

const validateSignupPayload = ({ name, email, password, confirmPassword }) => {
  if (!name?.trim()) {
    return 'Please enter your name';
  }

  if (!email?.trim()) {
    return 'Please enter your email';
  }

  if (!password) {
    return 'Please enter your password';
  }

  const passwordValidationError = validatePasswordStrength(password);

  if (passwordValidationError) {
    return passwordValidationError;
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
};

const validateChangePasswordPayload = ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  if (!currentPassword?.trim()) {
    return 'Current password is required';
  }

  if (!newPassword) {
    return 'New password is required';
  }

  const passwordValidationError = validatePasswordStrength(newPassword);

  if (passwordValidationError) {
    return passwordValidationError;
  }

  if (newPassword !== confirmPassword) {
    return 'New password and confirm password do not match';
  }

  if (currentPassword === newPassword) {
    return 'New password must be different from the current password';
  }

  return null;
};

module.exports = {
  validateChangePasswordPayload,
  validateLoginPayload,
  validatePasswordStrength,
  validateSignupPayload,
};
