const { demoUsers } = require('../data/demoUsers');
const { registeredUsers } = require('../data/registeredUsers');
const nodemailer = require('nodemailer');

const normalizeEmail = (email) => email.trim().toLowerCase();

const sanitizeUser = (user) => ({
  name: user.name,
  email: user.email,
  role: user.role,
});

// In-memory OTP storage
const otpStorage = {};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp) => {
  // For demo purposes, we'll log the OTP instead of sending email
  // In production, configure nodemailer with real email service
  console.log(`OTP for ${email}: ${otp}`);
  
  // Uncomment below for actual email sending (requires email service config)
  /*
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification OTP',
    text: `Your OTP for email verification is: ${otp}. It will expire in 10 minutes.`
  };

  await transporter.sendMail(mailOptions);
  */
};

const storeOTP = (email, otp) => {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStorage[email] = { otp, expiresAt };
};

const verifyOTP = (email, otp) => {
  const stored = otpStorage[email];
  if (!stored) return false;
  
  if (Date.now() > stored.expiresAt) {
    delete otpStorage[email];
    return false;
  }
  
  if (stored.otp === otp) {
    delete otpStorage[email];
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
