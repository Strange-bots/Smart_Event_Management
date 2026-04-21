const fs = require('fs');
const path = require('path');

const { events } = require('../data/events');
const { organizerEvents } = require('../data/organizerEvents');
const { findUserByEmail } = require('./authService');

const getEventStart = (event) => {
  const startTime = event.time?.split('-')[0]?.trim() ?? '12:00 AM';
  return new Date(`${event.date} ${startTime}`);
};

const formatEvent = (event) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  date: event.date,
  time: event.time,
  location: event.location || event.venue,
  venue: event.venue || event.location,
  category: event.category,
  capacity: event.capacity,
  registrations: event.registrations,
  image: event.image || event.imagePreview,
  imagePreview: event.imagePreview || event.image,
  status: event.status,
  isPaid: event.isPaid,
  price: event.price,
  tags: event.tags,
  organizerName: event.organizerName,
  organizerEmail: event.organizerEmail,
  dateLabel: event.dateLabel,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
});

const getAllEventRecords = () => [...events, ...organizerEvents];

const getNextUpcomingEvent = () => {
  const now = new Date();

  const nextEvent = getAllEventRecords()
    .filter((event) => event.status === 'approved')
    .filter((event) => getEventStart(event).getTime() > now.getTime())
    .sort((left, right) => getEventStart(left) - getEventStart(right))[0];

  return nextEvent ? formatEvent(nextEvent) : null;
};

const getRecommendationMatch = (event) => 78 + (event.id % 18);

const getRecommendedEvents = () => {
  const now = new Date();

  return getAllEventRecords()
    .filter((event) => event.status === 'approved')
    .filter((event) => getEventStart(event).getTime() > now.getTime())
    .sort((left, right) => getEventStart(left) - getEventStart(right))
    .slice(0, 3)
    .map((event) => ({
      ...formatEvent(event),
      attendees: event.registrations,
      match: getRecommendationMatch(event),
    }));
};

const getAllApprovedEvents = () => {
  return getAllEventRecords()
    .filter((event) => event.status === 'approved')
    .sort((left, right) => getEventStart(left) - getEventStart(right))
    .map((event) => ({
      ...formatEvent(event),
      categoryLabel: event.category,
    }));
};

const normalizeQueryValue = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const getEvents = ({ category, search } = {}) => {
  const normalizedCategory = normalizeQueryValue(category);
  const normalizedSearch = normalizeQueryValue(search);

  return getAllEventRecords()
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
        field?.toLowerCase().includes(normalizedSearch)
      );
    })
    .sort((left, right) => getEventStart(left) - getEventStart(right))
    .map(formatEvent);
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

const uploadAdminEventImage = ({ adminEmail, eventId, imageData }) => {
  const adminUser = findUserByEmail(adminEmail);

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

  const event = getAllEventRecords().find((item) => String(item.id) === String(eventId));

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
  const filePath = path.join(uploadsDirectory, fileName);
  fs.writeFileSync(filePath, imageBuffer);

  const imageUrl = `/uploads/events/${fileName}`;
  event.image = imageUrl;

  return {
    statusCode: 200,
    event: formatEvent(event),
    imageUrl,
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

const getOrganizerEvents = (organizerEmail) =>
  organizerEvents
    .filter((event) => event.organizerEmail === organizerEmail)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map(formatEvent);

const createOrganizerEvent = ({ organizer, payload }) => {
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
    organizerName: organizer.name || organizer.email,
    organizerEmail: organizer.email,
    status: 'pending',
    createdAt,
    updatedAt: createdAt,
  };

  organizerEvents.unshift(event);

  return {
    statusCode: 201,
    event: formatEvent(event),
  };
};

const getOrganizerOwnedEvent = ({ organizerEmail, eventId }) =>
  organizerEvents.find(
    (event) => String(event.id) === String(eventId) && event.organizerEmail === organizerEmail,
  );

const updateOrganizerEvent = ({ organizerEmail, eventId, payload }) => {
  const event = getOrganizerOwnedEvent({ organizerEmail, eventId });

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
    status: 'pending',
    updatedAt: new Date().toISOString(),
  });

  return {
    statusCode: 200,
    event: formatEvent(event),
  };
};

const duplicateOrganizerEvent = ({ organizer, eventId }) => {
  const event = getOrganizerOwnedEvent({ organizerEmail: organizer.email, eventId });

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

const deleteOrganizerEvent = ({ organizerEmail, eventId }) => {
  const eventIndex = organizerEvents.findIndex(
    (event) => String(event.id) === String(eventId) && event.organizerEmail === organizerEmail,
  );

  if (eventIndex === -1) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  organizerEvents.splice(eventIndex, 1);

  return {
    statusCode: 200,
  };
};

module.exports = {
  createOrganizerEvent,
  deleteOrganizerEvent,
  duplicateOrganizerEvent,
  getEvents,
  getNextUpcomingEvent,
  getOrganizerEvents,
  getRecommendedEvents,
  getAllApprovedEvents,
  updateOrganizerEvent,
  uploadAdminEventImage,
};
