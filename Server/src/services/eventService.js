const fs = require('fs');
const path = require('path');

const { events } = require('../data/events');
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
  location: event.location,
  category: event.category,
  capacity: event.capacity,
  registrations: event.registrations,
  image: event.image,
  status: event.status,
});

const getNextUpcomingEvent = () => {
  const now = new Date();

  const nextEvent = events
    .filter((event) => event.status === 'approved')
    .filter((event) => getEventStart(event).getTime() > now.getTime())
    .sort((left, right) => getEventStart(left) - getEventStart(right))[0];

  return nextEvent ? formatEvent(nextEvent) : null;
};

const getRecommendationMatch = (event) => 78 + (event.id % 18);

const getRecommendedEvents = () => {
  const now = new Date();

  return events
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
  return events
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

module.exports = {
  getEvents,
  getNextUpcomingEvent,
  getRecommendedEvents,
  getAllApprovedEvents,
  uploadAdminEventImage,
};
