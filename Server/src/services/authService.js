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

const buildOtpEmailHtml = (otp) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Smart Events Verification Code</title>
  </head>
  <body style="margin:0; padding:0; background-color:#eef3f8; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef3f8; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #d9e2ec; box-shadow:0 18px 45px rgba(15,30,51,0.12);">
            <tr>
              <td style="background-color:#1f4e79; padding:28px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="display:inline-block; width:48px; height:48px; line-height:48px; text-align:center; border-radius:12px; background-color:#ffffff; color:#1f4e79; font-size:20px; font-weight:800;">
                        SE
                      </div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <div style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.2px;">Smart Events</div>
                      <div style="color:#cbdceb; font-size:12px; text-transform:uppercase; letter-spacing:2px; margin-top:4px;">Email Verification</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:34px 32px 10px;">
                <h1 style="margin:0; color:#0f1e33; font-size:26px; line-height:1.25; font-weight:800;">
                  Verify your email address
                </h1>
                <p style="margin:14px 0 0; color:#53657a; font-size:15px; line-height:1.7;">
                  Use the one-time password below to finish creating your KOI Smart Events account. This helps us confirm that your student email address belongs to you.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                  <tr>
                    <td style="background-color:#fff4ec; border:1px solid #ffd8bf; border-radius:16px; padding:20px 28px;">
                      <div style="color:#f36f21; font-size:36px; line-height:1; font-weight:800; letter-spacing:10px; font-family:Arial, Helvetica, sans-serif;">
                        ${otp}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; border:1px solid #e8eef5; border-radius:14px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0 0 8px; color:#0f1e33; font-size:14px; font-weight:700;">
                        Security note
                      </p>
                      <p style="margin:0; color:#6b7c93; font-size:13px; line-height:1.6;">
                        This code expires in 10 minutes. Smart Events will never ask you to share this code outside the verification screen.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 32px; background-color:#f8fafc; border-top:1px solid #e8eef5;">
                <p style="margin:0; color:#6b7c93; font-size:12px; line-height:1.6;">
                  If you did not request this verification email, you can safely ignore it.
                </p>
                <p style="margin:10px 0 0; color:#9aa9bc; font-size:12px;">
                  KOI Smart Events
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const sendOTPEmail = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`OTP for ${email}: ${otp}`);
    return {
      delivered: false,
      preview: otp,
    };
  }

  const transporterOptions = process.env.EMAIL_HOST
    ? {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }
    : {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };

  const transporter = nodemailer.createTransport(transporterOptions);

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Your Smart Events verification code',
    text:
      `Your Smart Events verification code is ${otp}. ` +
      'It expires in 10 minutes. If you did not request this code, you can ignore this email.',
    html: buildOtpEmailHtml(otp),
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
