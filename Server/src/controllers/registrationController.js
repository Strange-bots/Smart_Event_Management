const {
  exportOrganizerRegistrations,
  getOrganizerRegistrationDetails,
  getRegistrationCountForEvent,
  getUserEventRegistrationDetails,
} = require('../services/registrationService');
const { events } = require('../data/events');
const { registrations } = require('../data/registrations');
const { registeredUsers } = require('../data/registeredUsers');
const {
  createSessionToken,
  createUser,
  findUserByEmail,
  sanitizeUser,
  updateUserPassword,
} = require('../services/authService');
const {
  sanitizeSignupRequest,
  validateSignupPayload,
} = require('../validators/authValidator');

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const getBookableEvents = () => events;

const createEventRegistration = (req, res) => {
  const user = req.user;
  const event = getBookableEvents().find(
    (item) => String(item.id) === String(req.params.eventId),
  );

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  if (event.status !== 'approved') {
    return res.status(400).json({
      message: 'Only approved events can be booked',
    });
  }

  const existingRegistration = registrations.find(
    (registration) =>
      String(registration.eventId) === String(event.id) &&
      normalizeEmail(registration.userEmail) === normalizeEmail(user.email) &&
      registration.attendanceStatus !== 'cancelled',
  );

  if (existingRegistration) {
    return res.status(409).json({
      message: 'You have already booked this event',
      registration: existingRegistration,
    });
  }

  const currentRegistrations = getRegistrationCountForEvent(event.id);
  const capacity = Number(event.capacity || 0);

  if (capacity > 0 && currentRegistrations >= capacity) {
    return res.status(409).json({
      message: 'This event is already at full capacity',
    });
  }

  const registration = {
    id: `reg-${event.id}-${Date.now()}`,
    eventId: event.id,
    userName: user.name,
    userEmail: user.email,
    registrationDate: new Date().toISOString().slice(0, 10),
    paymentStatus: event.isPaid ? 'unpaid' : 'paid',
    attendanceStatus: 'registered',
  };

  registrations.push(registration);
  event.registrations = getRegistrationCountForEvent(event.id);

  return res.status(201).json({
    message: 'Event booked successfully',
    registration,
    event: {
      id: event.id,
      title: event.title,
      registrations: event.registrations,
      capacity: event.capacity,
    },
  });
};

const listCurrentUserEventRegistrations = (req, res) => {
  const result = getUserEventRegistrationDetails(req.user?.email);

  return res.status(200).json({
    message: 'User event registrations fetched successfully',
    events: result.registrations,
  });
};

const createUserRegistration = async (req, res) => {
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

  const user = await createUser({
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

const updateUserRegistration = async (req, res) => {
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
    await updateUserPassword({
      email: user.email,
      newPassword: nextPassword,
    });
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
  createEventRegistration,
  createUserRegistration,
  deleteUserRegistration,
  downloadOrganizerRegistrations,
  listCurrentUserEventRegistrations,
  listUserRegistrations,
  listOrganizerRegistrations,
  updateUserRegistration,
};
