const {
  createRegistrationRecord,
  exportOrganizerRegistrations,
  getOrganizerRegistrationDetails,
  getRegistrationCountForEvent,
  getUserEventRegistrationDetails,
  validateRegistrationAvailability,
} = require('../services/registrationService');
const { events } = require('../store/events');
const { registrations } = require('../store/registrations');
const { registeredUsers } = require('../store/registeredUsers');
const { persistCollection } = require('../store/mongoSync');
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
const MANAGED_ROLES = new Set(['admin', 'organizer', 'user']);
const MANAGED_STATUSES = new Set(['active', 'inactive', 'pending']);

const formatAdminJoinDate = (dateString) => {
  if (!dateString) {
    return '';
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isActiveRegistration = (registration) =>
  registration.attendanceStatus !== 'cancelled';

const getAllManagedUsers = () => registeredUsers;
const findEventById = (eventId) =>
  events.find((event) => String(event.id) === String(eventId));

const syncEventRegistrationCount = (eventId) => {
  const event = findEventById(eventId);

  if (event) {
    event.registrations = getRegistrationCountForEvent(event.id);
  }
};

const formatAdminManagedUser = (user) => ({
  id: user.id || user.email,
  name: user.name,
  email: user.email,
  role: user.role || 'user',
  status: user.status || 'active',
  eventsRegistered: registrations.filter(
    (registration) =>
      normalizeEmail(registration.userEmail) === normalizeEmail(user.email) &&
      isActiveRegistration(registration),
  ).length,
  joinDate: formatAdminJoinDate(user.createdAt),
  avatar: user.avatar || null,
});

const findManagedUserByEmail = (email) =>
  getAllManagedUsers().find(
    (user) => normalizeEmail(user.email) === normalizeEmail(email),
  );

const getBookableEvents = () => events;

const createEventRegistration = async (req, res) => {
  const user = req.user;
  const availability = validateRegistrationAvailability({
    eventId: req.params.eventId,
    userEmail: user.email,
  });

  if (availability.error) {
    return res.status(availability.statusCode).json({
      message: availability.error,
      registration: availability.registration,
    });
  }

  const event = availability.event;

  if (event.isPaid && Number(event.price || 0) > 0) {
    return res.status(402).json({
      message: 'This is a paid event. Complete payment to confirm your registration.',
      requiresPayment: true,
      event: {
        id: event.id,
        title: event.title,
        price: Number(event.price || 0),
      },
    });
  }

  const registration = await createRegistrationRecord({
    event,
    user,
    paymentStatus: 'paid',
  });
  syncEventRegistrationCount(event.id);

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
    message: 'Users fetched successfully',
    users: getAllManagedUsers().map(formatAdminManagedUser),
  });
};

const createAdminManagedUser = async (req, res) => {
  const nextName = req.body?.name?.trim();
  const nextEmail = normalizeEmail(req.body?.email || '');
  const nextPassword = req.body?.password?.trim();
  const nextRole = String(req.body?.role || 'user').trim().toLowerCase();
  const nextStatus = String(req.body?.status || 'active').trim().toLowerCase();

  if (!nextName) {
    return res.status(400).json({ message: 'Name is required' });
  }

  if (!nextEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }

  if (!nextPassword || nextPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  if (!MANAGED_ROLES.has(nextRole)) {
    return res.status(400).json({ message: 'Role must be admin, organizer, or user' });
  }

  if (!MANAGED_STATUSES.has(nextStatus)) {
    return res.status(400).json({ message: 'Status must be active, inactive, or pending' });
  }

  if (findUserByEmail(nextEmail)) {
    return res.status(409).json({
      message: 'An account with this email already exists',
    });
  }

  const user = await createUser({
    name: nextName,
    email: nextEmail,
    password: nextPassword,
    role: nextRole,
    status: nextStatus,
  });
  const createdUser = findManagedUserByEmail(user.email);

  return res.status(201).json({
    message: 'User created successfully',
    user: formatAdminManagedUser(createdUser),
  });
};

const updateUserRegistration = async (req, res) => {
  const email = normalizeEmail(req.params.email);
  const user = findManagedUserByEmail(email);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const nextName = req.body?.name?.trim();
  const nextEmail = normalizeEmail(req.body?.email || user.email);
  const nextRole = req.body?.role ? String(req.body.role).trim().toLowerCase() : user.role;
  const nextStatus = req.body?.status
    ? String(req.body.status).trim().toLowerCase()
    : (user.status || 'active');

  if (typeof req.body?.password !== 'undefined') {
    return res.status(403).json({
      message: 'Admins cannot change user passwords',
    });
  }

  if (!MANAGED_ROLES.has(nextRole)) {
    return res.status(400).json({ message: 'Role must be admin, organizer, or user' });
  }

  if (!MANAGED_STATUSES.has(nextStatus)) {
    return res.status(400).json({ message: 'Status must be active, inactive, or pending' });
  }

  if (
    nextEmail !== email &&
    findManagedUserByEmail(nextEmail)
  ) {
    return res.status(409).json({
      message: 'An account with this email already exists',
    });
  }

  if (nextName) {
    user.name = nextName;

    registrations.forEach((registration) => {
      if (normalizeEmail(registration.userEmail) === email) {
        registration.userName = nextName;
      }
    });

    events.forEach((event) => {
      if (!Array.isArray(event.attendees)) {
        return;
      }

      event.attendees.forEach((attendee) => {
        if (normalizeEmail(attendee.userEmail) === email) {
          attendee.userName = nextName;
        }
      });
    });
  }

  if (nextEmail && nextEmail !== email) {
    user.email = nextEmail;

    registrations.forEach((registration) => {
      if (normalizeEmail(registration.userEmail) === email) {
        registration.userEmail = nextEmail;
      }
    });

    events.forEach((event) => {
      if (!Array.isArray(event.attendees)) {
        return;
      }

      event.attendees.forEach((attendee) => {
        if (normalizeEmail(attendee.userEmail) === email) {
          attendee.userEmail = nextEmail;
        }
      });
    });
  }

  user.role = nextRole;
  user.status = nextStatus;
  user.updatedAt = new Date().toISOString();
  await persistCollection('users');
  await persistCollection('registrations');
  await persistCollection('events');

  return res.status(200).json({
    message: 'User updated successfully',
    user: formatAdminManagedUser(user),
  });
};

const deleteUserRegistration = async (req, res) => {
  const email = normalizeEmail(req.params.email);
  const registeredUserIndex = registeredUsers.findIndex(
    (item) => normalizeEmail(item.email) === email,
  );

  if (registeredUserIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (normalizeEmail(req.user?.email || '') === email) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  const user = registeredUsers[registeredUserIndex];

  if (user.role === 'organizer') {
    const linkedEvents = events.filter(
      (event) =>
        [event.organizerEmail, event.organizerId]
          .filter(Boolean)
          .some((value) => normalizeEmail(value) === email),
    );

    if (linkedEvents.length > 0) {
      return res.status(409).json({
        message: 'Delete the organizer\'s related events first',
        linkedEvents: linkedEvents.map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          status: event.status,
        })),
      });
    }
  }

  registeredUsers.splice(registeredUserIndex, 1);

  for (let index = registrations.length - 1; index >= 0; index -= 1) {
    if (normalizeEmail(registrations[index].userEmail) === email) {
      const eventId = registrations[index].eventId;
      registrations.splice(index, 1);
      const event = findEventById(eventId);

      if (event && Array.isArray(event.attendees)) {
        event.attendees = event.attendees.filter(
          (attendee) => normalizeEmail(attendee.userEmail) !== email,
        );
      }

      syncEventRegistrationCount(eventId);
    }
  }

  await persistCollection('users');
  await persistCollection('registrations');
  await persistCollection('events');

  return res.status(200).json({
    message: 'User deleted successfully',
  });
};

const listOrganizerRegistrations = (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = getOrganizerRegistrationDetails(organizerEmail, req.query ?? {});

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Organizer registrations fetched successfully',
    organizer: result.organizer,
    registrations: result.registrations,
    summary: result.summary,
    eventOptions: result.eventOptions,
    filters: result.filters,
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
  createAdminManagedUser,
  createEventRegistration,
  createUserRegistration,
  deleteUserRegistration,
  downloadOrganizerRegistrations,
  listCurrentUserEventRegistrations,
  listUserRegistrations,
  listOrganizerRegistrations,
  updateUserRegistration,
};
