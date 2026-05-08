const { readSettingsFromDisk } = require('../services/adminSettingsService');
const { sanitizeString } = require('../utils/sanitizeInput');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KOI_EMAIL_REGEX = /^[^\s@]+@(?:[a-z0-9-]+\.)*koi\.edu\.au$/i;

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

const validateSignupPayload = ({
  name,
  email,
  password,
  confirmPassword,
  acceptedTerms,
}) => {
  if (!name?.trim()) {
    return 'Please enter your name';
  }

  if (!email?.trim()) {
    return 'Please enter your email';
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address';
  }

  if (!KOI_EMAIL_REGEX.test(email.trim())) {
    return 'Only @koi.edu.au email addresses are allowed';
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

  if (acceptedTerms !== true) {
    return 'You must accept the Terms, Privacy Policy, and platform guidelines to continue';
  }

  return null;
};

const sanitizeSignupRequest = (payload = {}) => ({
  name: sanitizeString(payload.name),
  email: sanitizeString(payload.email).toLowerCase(),
  password: typeof payload.password === 'string' ? payload.password.trim() : '',
});

// Restrict registration to approved student email addresses only.
const validateSecureSignupPayload = ({ name, email, password }) => {
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
  } else if (!KOI_EMAIL_REGEX.test(email)) {
    errors.push({
      field: 'email',
      message: 'Only @koi.edu.au email addresses are allowed',
    });
  }

  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is required',
    });
  } else if (password.length < 6) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 6 characters long',
    });
  }

  return errors;
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

const validateProfileUpdatePayload = ({ name, phone }) => {
  if (!name?.trim()) {
    return 'Name is required';
  }

  if (phone && !/^[0-9+\s()-]{6,20}$/.test(phone.trim())) {
    return 'Please enter a valid mobile number';
  }

  return null;
};

const validateForgotPasswordRequestPayload = ({ email }) => {
  if (!email?.trim()) {
    return 'Email is required';
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address';
  }

  if (!KOI_EMAIL_REGEX.test(email.trim())) {
    return 'Only @koi.edu.au email addresses are allowed';
  }

  return null;
};

const validateForgotPasswordResetPayload = ({
  email,
  otp,
  newPassword,
  confirmPassword,
}) => {
  const emailValidationError = validateForgotPasswordRequestPayload({ email });

  if (emailValidationError) {
    return emailValidationError;
  }

  if (!otp?.trim()) {
    return 'OTP is required';
  }

  if (!/^\d{6}$/.test(otp.trim())) {
    return 'OTP must be a 6 digit code';
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

  return null;
};

module.exports = {
  validateForgotPasswordRequestPayload,
  validateForgotPasswordResetPayload,
  sanitizeSignupRequest,
  validateChangePasswordPayload,
  validateLoginPayload,
  validatePasswordStrength,
  validateProfileUpdatePayload,
  validateSecureSignupPayload,
  validateSignupPayload,
};
