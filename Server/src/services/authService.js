const { demoUsers } = require('../data/demoUsers');
const { registeredUsers } = require('../data/registeredUsers');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const normalizeEmail = (email) => email.trim().toLowerCase();
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000;
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'smart-event-management-dev-session-secret';

const sanitizeUser = (user) => ({
  name: user.name,
  email: user.email,
  role: user.role,
});

const encodeBase64Url = (value) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const signPayload = (payload) =>
  crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

const createSessionToken = (user) => {
  const payload = encodeBase64Url({
    email: normalizeEmail(user.email),
    role: user.role,
    exp: Date.now() + SESSION_EXPIRY_MS,
  });
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
};

const verifySessionToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature || signPayload(payload) !== signature) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

    if (!session.email || !session.role || Date.now() > session.exp) {
      return null;
    }

    const user = findUserByEmail(session.email);

    if (!user || user.role !== session.role) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
};

// In-memory OTP storage
const otpStorage = {};
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const hashOTP = (otp) =>
  crypto.createHash('sha256').update(String(otp)).digest('hex');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`OTP for ${email}: ${otp}`);
    return {
      delivered: false,
      preview: otp,
    };
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification OTP',
    text: `Your OTP for email verification is: ${otp}. It will expire in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);

  return {
    delivered: true,
  };
};

const storeOTP = (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStorage[normalizedEmail] = {
    otpHash: hashOTP(otp),
    expiresAt,
  };
};

const verifyOTP = (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const stored = otpStorage[normalizedEmail];
  if (!stored) return false;
  
  if (Date.now() > stored.expiresAt) {
    delete otpStorage[normalizedEmail];
    return false;
  }
  
  if (stored.otpHash === hashOTP(otp)) {
    delete otpStorage[normalizedEmail];
    return true;
  }
  
  return false;
};

const findUserByEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);

  return [...demoUsers, ...registeredUsers].find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );
};

const findUserByCredentials = (email, password) => {
  const normalizedEmail = normalizeEmail(email);

  return [...demoUsers, ...registeredUsers].find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
  );
};

const createUser = ({ name, email, password }) => {
  const newUser = {
    name: name.trim(),
    email: normalizeEmail(email),
    password,
    role: 'user',
  };

  registeredUsers.push(newUser);

  return sanitizeUser(newUser);
};

const updateUserPassword = ({ email, newPassword }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = [...demoUsers, ...registeredUsers].find(
    (item) => item.email.toLowerCase() === normalizedEmail,
  );

  if (!user) {
    return null;
  }

  user.password = newPassword;

  return sanitizeUser(user);
};

module.exports = {
  createSessionToken,
  createUser,
  findUserByCredentials,
  findUserByEmail,
  sanitizeUser,
  updateUserPassword,
  verifySessionToken,
  generateOTP,
  sendOTPEmail,
  storeOTP,
  verifyOTP,
};
