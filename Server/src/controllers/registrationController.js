const {
  exportOrganizerRegistrations,
  getOrganizerRegistrationDetails,
} = require('../services/registrationService');
const { registeredUsers } = require('../data/registeredUsers');
const {
  createSessionToken,
  createUser,
  findUserByEmail,
  sanitizeUser,
} = require('../services/authService');
const {
  sanitizeSignupRequest,
  validateSignupPayload,
} = require('../validators/authValidator');

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const createUserRegistration = (req, res) => {
  const sanitizedPayload = sanitizeSignupRequest(req.body);
  const validationError = validateSignupPayload({
    name: sanitizedPayload.name,
    email: sanitizedPayload.email,
    password: sanitizedPayload.password,
    confirmPassword: req.body?.confirmPassword,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  if (findUserByEmail(sanitizedPayload.email)) {
    return res.status(409).json({
      message: 'An account with this email already exists',
    });
  }

  const user = createUser({
    name: sanitizedPayload.name,
    email: sanitizedPayload.email,
    password: sanitizedPayload.password,
  });
  const createdUser = findUserByEmail(user.email);

  return res.status(201).json({
    message: 'Account created successfully',
    user,
    token: createSessionToken(createdUser),
  });
};

const listUserRegistrations = (req, res) => {
  return res.status(200).json({
    message: 'Registered users fetched successfully',
    users: registeredUsers.map(sanitizeUser),
  });
};

const updateUserRegistration = (req, res) => {
  const email = normalizeEmail(req.params.email);
  const user = registeredUsers.find((item) => normalizeEmail(item.email) === email);

  if (!user) {
    return res.status(404).json({ message: 'Registered user not found' });
  }

  const nextName = req.body?.name?.trim();
  const nextPassword = req.body?.password?.trim();

  if (nextName) {
    user.name = nextName;
  }

  if (nextPassword) {
    user.password = nextPassword;
  }

  user.role = 'user';

  return res.status(200).json({
    message: 'Registered user updated successfully',
    user: sanitizeUser(user),
  });
};

const deleteUserRegistration = (req, res) => {
  const email = normalizeEmail(req.params.email);
  const userIndex = registeredUsers.findIndex(
    (item) => normalizeEmail(item.email) === email,
  );

  if (userIndex === -1) {
    return res.status(404).json({ message: 'Registered user not found' });
  }

  registeredUsers.splice(userIndex, 1);

  return res.status(200).json({
    message: 'Registered user deleted successfully',
  });
};

const listOrganizerRegistrations = (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = getOrganizerRegistrationDetails(organizerEmail);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Organizer registrations fetched successfully',
    organizer: result.organizer,
    registrations: result.registrations,
  });
};

const downloadOrganizerRegistrations = (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = exportOrganizerRegistrations(organizerEmail, req.query ?? {});

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${result.fileName}"`,
  );

  return res.status(200).send(result.workbook);
};

module.exports = {
  createUserRegistration,
  deleteUserRegistration,
  downloadOrganizerRegistrations,
  listUserRegistrations,
  listOrganizerRegistrations,
  updateUserRegistration,
};
