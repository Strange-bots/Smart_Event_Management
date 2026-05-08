const fs = require('fs');
const path = require('path');

const { readCollection, writeCollection } = require('../database/collections');
const { findUserByEmail } = require('./authService');

const getEventStart = (event) => {
  const startTime = event.time?.split('-')[0]?.trim() ?? '12:00 AM';
  return new Date(`${event.date} ${startTime}`);
};

const getApprovedEventSortTime = (event) =>
  new Date(event.approvedAt || event.updatedAt || event.createdAt || 0).getTime();

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const eventBelongsToOrganizer = (event, organizerEmail) => {
  const normalizedOrganizer = organizerEmail.toLowerCase();

  return [event.organizerEmail, event.organizerId]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase() === normalizedOrganizer);
};

const getRegistrationCountForEventFrom = (registrations, eventId) =>
  registrations.filter(
    (registration) =>
      String(registration.eventId) === String(eventId) &&
      registration.attendanceStatus !== 'cancelled',
  ).length;

const getOrganizerDisplayName = (event, users = []) => {
  const organizerEmail = normalizeEmail(event.organizerEmail || event.organizerId || '');
  const organizer = users.find(
    (user) => normalizeEmail(user.email) === organizerEmail,
  );

  return organizer?.name || event.organizerName;
};

const formatEventWithRegistrations = (event, registrations, users = []) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  date: event.date,
  time: event.time,
  location: event.location || event.venue,
  venue: event.venue || event.location,
  category: event.category,
  capacity: event.capacity,
  registrations: getRegistrationCountForEventFrom(registrations, event.id),
  image: event.image || event.imagePreview,
  imagePreview: event.imagePreview || event.image,
  status: event.status,
  isPaid: event.isPaid,
  price: event.price,
  tags: event.tags,
  organizerId: event.organizerId,
  organizerName: getOrganizerDisplayName(event, users),
  organizerEmail: event.organizerEmail,
  dateLabel: event.dateLabel,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
});

const formatGalleryItem = (event, users = []) => ({
  id: String(event.id),
  eventId: event.id,
  title: event.title,
  date: event.date,
  category: event.category,
  organizerName: getOrganizerDisplayName(event, users),
  organizerEmail: event.organizerEmail,
  url: event.image || event.imagePreview || '',
});

const getCollections = async () => {
  const [events, registrations, notifications, paymentTransactions] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
    readCollection('notifications'),
    readCollection('paymentTransactions'),
  ]);

  return {
    events,
    registrations,
    notifications,
    paymentTransactions,
  };
};

const createRefundNotification = ({
  notifications,
  event,
  registration,
  transaction,
  deletedBy,
  deletedByEmail,
}) => {
  const amount = Number(transaction?.amount || event.price || 0);
  const refundMessage = amount > 0
    ? `The paid event '${event.title}' was cancelled. A refund of AUD ${amount.toFixed(2)} will be processed for your registration.`
    : `The paid event '${event.title}' was cancelled. Your payment will be refunded.`;

  notifications.unshift({
    id: `notif-refund-${event.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userEmail: registration.userEmail,
    role: 'user',
    type: 'refund',
    title: 'Refund In Progress',
    message: refundMessage,
    body: refundMessage,
    isRead: false,
    createdAt: new Date().toISOString(),
    from: deletedBy,
    fromEmail: deletedByEmail,
    relatedEntityType: 'event',
    relatedEntityId: event.id,
  });
};

const cleanupDeletedEvent = async ({
  event,
  deletedBy,
  deletedByEmail,
  registrations,
  paymentTransactions,
  notifications,
}) => {
  for (let index = registrations.length - 1; index >= 0; index -= 1) {
    const registration = registrations[index];

    if (String(registration.eventId) !== String(event.id)) {
      continue;
    }

    const transaction = paymentTransactions.find(
      (item) =>
        String(item.eventId) === String(event.id) &&
        normalizeEmail(item.userEmail) === normalizeEmail(registration.userEmail) &&
        item.paymentStatus === 'paid',
    );

    if (transaction) {
      transaction.paymentStatus = 'refund_pending';
      transaction.refundRequestedAt = new Date().toISOString();

      createRefundNotification({
        notifications,
        event,
        registration,
        transaction,
        deletedBy,
        deletedByEmail,
      });
    }

    registrations.splice(index, 1);
  }

  await Promise.all([
    writeCollection('registrations', registrations),
    writeCollection('paymentTransactions', paymentTransactions),
    writeCollection('notifications', notifications),
  ]);
};

const getNextUpcomingEvent = async () => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);
  const now = new Date();

  const nextEvent = events
    .filter((event) => event.status === 'approved')
    .filter((event) => getEventStart(event).getTime() > now.getTime())
    .sort((left, right) => getEventStart(left) - getEventStart(right))[0];

  return nextEvent ? formatEventWithRegistrations(nextEvent, registrations) : null;
};

const getRecommendationMatch = (event) => {
  const numericId = Number(event.id);

  return 78 + (Number.isFinite(numericId) ? numericId % 18 : 0);
};

const getRecommendedEvents = async () => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);
  const now = new Date();

  return events
    .filter((event) => event.status === 'approved')
    .filter((event) => getEventStart(event).getTime() > now.getTime())
    .sort((left, right) => getEventStart(left) - getEventStart(right))
    .slice(0, 3)
    .map((event) => ({
      ...formatEventWithRegistrations(event, registrations),
      attendees: getRegistrationCountForEventFrom(registrations, event.id),
      match: getRecommendationMatch(event),
    }));
};

const getFeaturedEvents = async () => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);
  const now = new Date();

  return events
    .filter((event) => event.status === 'approved')
    .filter((event) => getEventStart(event).getTime() > now.getTime())
    .sort((left, right) => {
      const registrationDifference =
        getRegistrationCountForEventFrom(registrations, right.id) -
        getRegistrationCountForEventFrom(registrations, left.id);

      if (registrationDifference !== 0) {
        return registrationDifference;
      }

      return getEventStart(left) - getEventStart(right);
    })
    .slice(0, 6)
    .map((event, index) => ({
      ...formatEventWithRegistrations(event, registrations),
      attendees: getRegistrationCountForEventFrom(registrations, event.id),
      featured: index === 0,
    }));
};

const getAllApprovedEvents = async () => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);

  return events
    .filter((event) => event.status === 'approved')
    .sort((left, right) => {
      const approvalDifference = getApprovedEventSortTime(right) - getApprovedEventSortTime(left);

      if (approvalDifference !== 0) {
        return approvalDifference;
      }

      return getEventStart(left) - getEventStart(right);
    })
    .map((event) => ({
      ...formatEventWithRegistrations(event, registrations),
      categoryLabel: event.category,
    }));
};

const normalizeQueryValue = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const getEvents = async ({ category, search } = {}) => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);
  const normalizedCategory = normalizeQueryValue(category);
  const normalizedSearch = normalizeQueryValue(search);

  return events
    .filter((event) => event.status === 'approved')
    .filter((event) => {
      if (!normalizedCategory) {
        return true;
      }

      return event.category.toLowerCase() === normalizedCategory;
    })
    .filter((event) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchableFields = [
        event.title,
        event.description,
        event.category,
        event.location,
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(normalizedSearch),
      );
    })
    .sort((left, right) => {
      const approvalDifference = getApprovedEventSortTime(right) - getApprovedEventSortTime(left);

      if (approvalDifference !== 0) {
        return approvalDifference;
      }

      return getEventStart(left) - getEventStart(right);
    })
    .map((event) => formatEventWithRegistrations(event, registrations));
};

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const uploadsDirectory = path.resolve(__dirname, '../../uploads/events');

const extractImagePayload = (imageData) => {
  if (typeof imageData !== 'string') {
    return null;
  }

  const matches = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!matches) {
    return null;
  }

  return {
    mimeType: matches[1].toLowerCase(),
    base64Content: matches[2],
  };
};

const uploadAdminEventImage = async ({ adminEmail, eventId, imageData }) => {
  const adminUser = await findUserByEmail(adminEmail);

  if (!adminUser) {
    return {
      error: 'Admin account not found',
      statusCode: 404,
    };
  }

  if (adminUser.role !== 'admin') {
    return {
      error: 'Only admins can upload event gallery images',
      statusCode: 403,
    };
  }

  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);
  const event = events.find((item) => String(item.id) === String(eventId));

  if (!event) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  const payload = extractImagePayload(imageData);

  if (!payload) {
    return {
      error: 'Image data must be a valid base64 data URL',
      statusCode: 400,
    };
  }

  const fileExtension = ALLOWED_IMAGE_TYPES[payload.mimeType];

  if (!fileExtension) {
    return {
      error: 'Only JPEG, PNG, WEBP, and GIF images are allowed',
      statusCode: 400,
    };
  }

  const imageBuffer = Buffer.from(payload.base64Content, 'base64');

  if (!imageBuffer.length) {
    return {
      error: 'Uploaded image is empty',
      statusCode: 400,
    };
  }

  if (imageBuffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      error: 'Image size must be 5 MB or less',
      statusCode: 400,
    };
  }

  fs.mkdirSync(uploadsDirectory, { recursive: true });

  const fileName = `event-${event.id}-${Date.now()}${fileExtension}`;
  fs.writeFileSync(path.join(uploadsDirectory, fileName), imageBuffer);

  event.image = `/uploads/events/${fileName}`;
  event.updatedAt = new Date().toISOString();
  await writeCollection('events', events);

  return {
    statusCode: 200,
    event: formatEventWithRegistrations(event, registrations),
    imageUrl: event.image,
  };
};

const normalizeOrganizerEventPayload = (payload = {}) => ({
  title: String(payload.title || '').trim(),
  description: String(payload.description || '').trim(),
  date: String(payload.date || '').trim(),
  dateLabel: String(payload.dateLabel || '').trim(),
  time: String(payload.time || '').trim(),
  venue: String(payload.venue || payload.location || '').trim(),
  location: String(payload.venue || payload.location || '').trim(),
  category: String(payload.category || '').trim(),
  capacity: Number(payload.capacity || 0),
  registrations: Number(payload.registrations || 0),
  isPaid: Boolean(payload.isPaid),
  price: payload.isPaid ? Number(payload.price || 0) : 0,
  tags: Array.isArray(payload.tags)
    ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
    : [],
  imagePreview: String(payload.imagePreview || payload.image || '').trim(),
  image: String(payload.image || payload.imagePreview || '').trim(),
});

const validateOrganizerEventPayload = (event) => {
  if (!event.title) return 'Event title is required';
  if (!event.description) return 'Event description is required';
  if (!event.date) return 'Event date is required';
  if (!event.time) return 'Event time is required';
  if (!event.venue) return 'Event venue is required';
  if (!event.category) return 'Event category is required';
  if (!event.capacity || event.capacity <= 0) return 'Event capacity must be greater than 0';
  if (!event.tags.length) return 'At least one event tag is required';
  if (event.isPaid && (!event.price || event.price <= 0)) {
    return 'Ticket price must be greater than 0 for paid events';
  }
  return null;
};

const getOrganizerEvents = async (organizerEmail) => {
  const [events, registrations, users] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
    readCollection('users'),
  ]);

  return events
    .filter((event) => eventBelongsToOrganizer(event, organizerEmail))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((event) => formatEventWithRegistrations(event, registrations, users));
};

const getAdminEvents = async () => {
  const [events, registrations, users] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
    readCollection('users'),
  ]);

  return events
    .filter((event) => Boolean(event.organizerEmail || event.organizerId))
    .slice()
    .sort((left, right) => {
      const rightTimestamp = new Date(right.updatedAt || right.createdAt || right.date).getTime();
      const leftTimestamp = new Date(left.updatedAt || left.createdAt || left.date).getTime();
      return rightTimestamp - leftTimestamp;
    })
    .map((event) => formatEventWithRegistrations(event, registrations, users));
};

const getAdminGalleryImages = async () => {
  const [events, users] = await Promise.all([
    readCollection('events'),
    readCollection('users'),
  ]);

  return events
    .filter((event) => Boolean(event.organizerEmail || event.organizerId))
    .filter((event) => Boolean(event.image || event.imagePreview))
    .sort((left, right) => getEventStart(right) - getEventStart(left))
    .map((event) => formatGalleryItem(event, users));
};

const updateAdminEventStatus = async ({ eventId, status }) => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);
  const event = events.find((item) => String(item.id) === String(eventId));

  if (!event) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  event.status = status;
  event.updatedAt = new Date().toISOString();

  if (status === 'approved') {
    event.approvedAt = event.updatedAt;
  }

  await writeCollection('events', events);

  return {
    statusCode: 200,
    event: formatEventWithRegistrations(event, registrations),
  };
};

const createOrganizerEvent = async ({ organizer, payload }) => {
  const events = await readCollection('events');
  const normalizedEvent = normalizeOrganizerEventPayload(payload);
  const validationError = validateOrganizerEventPayload(normalizedEvent);

  if (validationError) {
    return {
      error: validationError,
      statusCode: 400,
    };
  }

  const createdAt = new Date().toISOString();
  const event = {
    id: `event-${Date.now()}`,
    ...normalizedEvent,
    registrations: 0,
    organizerId: organizer.id || organizer.email,
    organizerName: organizer.name || organizer.email,
    organizerEmail: organizer.email,
    status: 'pending',
    createdAt,
    updatedAt: createdAt,
  };

  events.unshift(event);
  await writeCollection('events', events);

  return {
    statusCode: 201,
    event: formatEventWithRegistrations(event, []),
  };
};

const updateOrganizerEvent = async ({ organizerEmail, eventId, payload }) => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);
  const event = events.find(
    (item) => String(item.id) === String(eventId) && eventBelongsToOrganizer(item, organizerEmail),
  );

  if (!event) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  const normalizedEvent = normalizeOrganizerEventPayload({
    ...event,
    ...payload,
  });
  const validationError = validateOrganizerEventPayload(normalizedEvent);

  if (validationError) {
    return {
      error: validationError,
      statusCode: 400,
    };
  }

  Object.assign(event, normalizedEvent, {
    registrations: getRegistrationCountForEventFrom(registrations, event.id),
    status: 'pending',
    updatedAt: new Date().toISOString(),
  });
  await writeCollection('events', events);

  return {
    statusCode: 200,
    event: formatEventWithRegistrations(event, registrations),
  };
};

const duplicateOrganizerEvent = async ({ organizer, eventId }) => {
  const events = await readCollection('events');
  const event = events.find(
    (item) => String(item.id) === String(eventId) && eventBelongsToOrganizer(item, organizer.email),
  );

  if (!event) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  return createOrganizerEvent({
    organizer,
    payload: {
      ...event,
      title: `${event.title} Copy`,
      registrations: 0,
    },
  });
};

const deleteOrganizerEvent = async ({ organizerEmail, eventId }) => {
  const collections = await getCollections();
  const eventIndex = collections.events.findIndex(
    (event) => String(event.id) === String(eventId) && eventBelongsToOrganizer(event, organizerEmail),
  );

  if (eventIndex === -1) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  const [event] = collections.events.splice(eventIndex, 1);
  await cleanupDeletedEvent({
    event,
    deletedBy: 'Organizer Team',
    deletedByEmail: organizerEmail,
    registrations: collections.registrations,
    paymentTransactions: collections.paymentTransactions,
    notifications: collections.notifications,
  });
  await writeCollection('events', collections.events);

  return {
    statusCode: 200,
  };
};

const deleteAdminEvent = async (eventId) => {
  const collections = await getCollections();
  const eventIndex = collections.events.findIndex((event) => String(event.id) === String(eventId));

  if (eventIndex === -1) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  const [event] = collections.events.splice(eventIndex, 1);
  await cleanupDeletedEvent({
    event,
    deletedBy: 'Admin Team',
    deletedByEmail: 'admin@smartevents.local',
    registrations: collections.registrations,
    paymentTransactions: collections.paymentTransactions,
    notifications: collections.notifications,
  });
  await writeCollection('events', collections.events);

  return {
    statusCode: 200,
  };
};

const deleteAdminEventImage = async (eventId) => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);
  const event = events.find((item) => String(item.id) === String(eventId));

  if (!event) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  event.image = '';
  event.imagePreview = '';
  event.updatedAt = new Date().toISOString();
  await writeCollection('events', events);

  return {
    statusCode: 200,
    event: formatEventWithRegistrations(event, registrations),
  };
};

module.exports = {
  getAdminEvents,
  getAdminGalleryImages,
  createOrganizerEvent,
  deleteAdminEvent,
  deleteAdminEventImage,
  deleteOrganizerEvent,
  duplicateOrganizerEvent,
  getEvents,
  getFeaturedEvents,
  getNextUpcomingEvent,
  getOrganizerEvents,
  getRecommendedEvents,
  getAllApprovedEvents,
  updateAdminEventStatus,
  updateOrganizerEvent,
  uploadAdminEventImage,
};
