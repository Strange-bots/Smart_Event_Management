const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');

const { readCollection, writeCollection } = require('../database/collections');

const normalizeEmail = (email) => email.trim().toLowerCase();
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000;
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'smart-event-management-dev-session-secret';
const PASSWORD_SALT_ROUNDS = 10;

const isBcryptHash = (value = '') =>
  typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);

const ensureHashedPassword = async (user) => {
  if (!user || isBcryptHash(user.password)) {
    return user;
  }

  user.password = await bcrypt.hash(user.password, PASSWORD_SALT_ROUNDS);
  return user;
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
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

const listUsers = async () => {
  const users = await readCollection('users');

  for (const user of users) {
    await ensureHashedPassword(user);
  }

  return users;
};

const saveUsers = async (users) => {
  await writeCollection('users', users);
  return users;
};

const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const users = await listUsers();

  return users.find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  ) || null;
};

const verifySessionToken = async (token) => {
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

    const user = await findUserByEmail(session.email);

    if (!user || user.role !== session.role) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
};

const findUserByCredentials = async (email, password) => {
  const matchedUser = await findUserByEmail(email);

  if (!matchedUser) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, matchedUser.password);
  return passwordMatches ? matchedUser : null;
};

// In-memory OTP storage
const otpStorage = {};
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const hashOTP = (otp) =>
  crypto.createHash('sha256').update(String(otp)).digest('hex');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const buildOtpEmailHtml = (otp, options = {}) => {
  const purpose = options.purpose === 'password-reset' ? 'password-reset' : 'signup';
  const title =
    purpose === 'password-reset'
      ? 'Reset your Smart Events password'
      : 'Verify your email address';
  const eyebrow =
    purpose === 'password-reset' ? 'Password Reset' : 'Email Verification';
  const intro =
    purpose === 'password-reset'
      ? 'Use the one-time password below to reset your KOI Smart Events account password. This helps us confirm that the request came from you.'
      : 'Use the one-time password below to finish creating your KOI Smart Events account. This helps us confirm that your student email address belongs to you.';
  const footer =
    purpose === 'password-reset'
      ? 'If you did not request a password reset, you can ignore this email and keep using your current password.'
      : 'If you did not request this verification email, you can safely ignore it.';

  return `
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
                      <div style="color:#cbdceb; font-size:12px; text-transform:uppercase; letter-spacing:2px; margin-top:4px;">${eyebrow}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px 10px;">
                <h1 style="margin:0; color:#0f1e33; font-size:26px; line-height:1.25; font-weight:800;">
                  ${title}
                </h1>
                <p style="margin:14px 0 0; color:#53657a; font-size:15px; line-height:1.7;">
                  ${intro}
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
                  ${footer}
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
};

const sendOTPEmail = async (email, otp, options = {}) => {
  const purpose = options.purpose === 'password-reset' ? 'password-reset' : 'signup';
  const subject =
    purpose === 'password-reset'
      ? 'Your Smart Events password reset code'
      : 'Your Smart Events verification code';
  const text =
    purpose === 'password-reset'
      ? `Your Smart Events password reset code is ${otp}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`
      : `Your Smart Events verification code is ${otp}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`;
  const fromAddress = process.env.EMAIL_FROM;
  const html = buildOtpEmailHtml(otp, options);

  if (!process.env.RESEND_API_KEY || !fromAddress) {
    console.log(`OTP for ${email}: ${otp}`);
    return {
      delivered: false,
      preview: otp,
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: fromAddress,
    to: [email],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || 'Resend failed to deliver the OTP email');
  }

  return {
    delivered: true,
    provider: 'resend',
  };
};

const storeOTP = (email, otp, purpose = 'signup') => {
  const normalizedEmail = normalizeEmail(email);
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStorage[normalizedEmail] = {
    purpose,
    otpHash: hashOTP(otp),
    expiresAt,
  };
};

const verifyOTP = (email, otp, purpose = 'signup') => {
  const normalizedEmail = normalizeEmail(email);
  const stored = otpStorage[normalizedEmail];

  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expiresAt) {
    delete otpStorage[normalizedEmail];
    return false;
  }

  if (stored.purpose !== purpose) {
    return false;
  }

  if (stored.otpHash === hashOTP(otp)) {
    delete otpStorage[normalizedEmail];
    return true;
  }

  return false;
};

const createUser = async ({ name, email, password, role = 'user', status = 'active' }) => {
  const users = await listUsers();
  const newUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    firstName: name.trim().split(' ')[0],
    lastName: name.trim().split(' ').slice(1).join(' '),
    email: normalizeEmail(email),
    password: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS),
    role,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: null,
    avatar: null,
    phone: null,
    studentId: null,
    course: null,
    campus: null,
    yearLevel: null,
    department: null,
    position: null,
    dateOfBirth: null,
    address: null,
    bio: null,
    emergencyContact: null,
    interests: [],
    preferences: {
      notifications: true,
      emailDigest: false,
      preferredEventCategories: [],
    },
  };

  users.push(newUser);
  await saveUsers(users);

  return sanitizeUser(newUser);
};

const updateUserPassword = async ({ email, newPassword }) => {
  const users = await listUsers();
  const normalizedEmail = normalizeEmail(email);
  const user = users.find(
    (item) => item.email.toLowerCase() === normalizedEmail,
  );

  if (!user) {
    return null;
  }

  user.password = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  user.updatedAt = new Date().toISOString();
  await saveUsers(users);

  return sanitizeUser(user);
};

const updateUserProfile = async ({ currentEmail, name, phone }) => {
  const [users, events] = await Promise.all([
    listUsers(),
    readCollection('events'),
  ]);
  const normalizedCurrentEmail = normalizeEmail(currentEmail);
  const trimmedName = String(name || '').trim();
  const trimmedPhone = phone ? String(phone).trim() : '';
  const user = users.find(
    (item) => item.email.toLowerCase() === normalizedCurrentEmail,
  );

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  user.name = trimmedName;
  user.firstName = trimmedName.split(/\s+/)[0] || '';
  user.lastName = trimmedName.split(/\s+/).slice(1).join(' ');
  user.phone = trimmedPhone;
  user.updatedAt = new Date().toISOString();

  events.forEach((event) => {
    const organizerEmail = normalizeEmail(event.organizerEmail || event.organizerId || '');

    if (organizerEmail === normalizedCurrentEmail) {
      event.organizerName = trimmedName;
      event.updatedAt = new Date().toISOString();
    }
  });

  await Promise.all([
    saveUsers(users),
    writeCollection('events', events),
  ]);

  return {
    statusCode: 200,
    user: (({ password, ...profile }) => profile)(user),
  };
};

module.exports = {
  createSessionToken,
  createUser,
  findUserByCredentials,
  findUserByEmail,
  listUsers,
  sanitizeUser,
  updateUserProfile,
  updateUserPassword,
  verifySessionToken,
  generateOTP,
  sendOTPEmail,
  storeOTP,
  verifyOTP,
};
