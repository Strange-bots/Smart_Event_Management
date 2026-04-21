const { demoUsers } = require('../data/demoUsers');
const { registeredUsers } = require('../data/registeredUsers');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const normalizeEmail = (email) => email.trim().toLowerCase();

const sanitizeUser = (user) => ({
  name: user.name,
  email: user.email,
  role: user.role,
});

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

module.exports = {
  createUser,
  findUserByCredentials,
  findUserByEmail,
  sanitizeUser,
  generateOTP,
  sendOTPEmail,
  storeOTP,
  verifyOTP,
};
