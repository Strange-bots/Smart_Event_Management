const { readCollection } = require('../database/collections');

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const getNormalizedIdentifiers = (identifiers = {}) =>
  new Set(
    [identifiers.email, identifiers.id]
      .filter(Boolean)
      .map((value) => normalizeEmail(value)),
  );

const eventBelongsToOrganizer = (event, organizerIdentifiers) => {
  const normalizedIdentifiers = getNormalizedIdentifiers(organizerIdentifiers);

  return [event.organizerEmail, event.organizerId]
    .filter(Boolean)
    .some((value) => normalizedIdentifiers.has(normalizeEmail(value)));
};

const getEventStart = (event) => {
  const startTime = String(event.time || '')
    .split('-')[0]
    ?.trim() || '12:00 AM';

  const startDate = new Date(`${event.date} ${startTime}`);
  return Number.isNaN(startDate.getTime()) ? null : startDate;
};

const getEventEnd = (event, startDate) => {
  const endTime = String(event.time || '')
    .split('-')[1]
    ?.trim();

  if (endTime) {
    const endDate = new Date(`${event.date} ${endTime}`);

    if (!Number.isNaN(endDate.getTime()) && (!startDate || endDate >= startDate)) {
      return endDate;
    }
  }

  if (!startDate) {
    return null;
  }

  const fallbackEnd = new Date(startDate);
  fallbackEnd.setHours(fallbackEnd.getHours() + 2);
  return fallbackEnd;
};

const getCalendarState = (event, now = new Date()) => {
  const startDate = getEventStart(event);
  const endDate = getEventEnd(event, startDate);

  if (!startDate || !endDate) {
    return 'coming';
  }

  if (now < startDate) {
    return 'coming';
  }

  if (now > endDate) {
    return 'gone';
  }

  return 'ongoing';
};

const getRegistrationCountForEvent = (registrations, eventId) =>
  registrations.filter(
    (registration) =>
      String(registration.eventId) === String(eventId) &&
      registration.attendanceStatus !== 'cancelled',
  ).length;

const formatCalendarEvent = (event, registrations, now = new Date()) => {
  const startDate = getEventStart(event);
  const endDate = getEventEnd(event, startDate);

  return {
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    venue: event.venue || event.location || 'TBA',
    location: event.location || event.venue || 'TBA',
    category: event.category,
    status: event.status,
    capacity: Number(event.capacity || 0),
    registrations: getRegistrationCountForEvent(registrations, event.id),
    organizerName: event.organizerName,
    organizerEmail: event.organizerEmail,
    calendarState: getCalendarState(event, now),
    startAt: startDate?.toISOString() || null,
    endAt: endDate?.toISOString() || null,
  };
};

const getUserRegisteredEventIds = (registrations, userEmail) =>
  new Set(
    registrations
      .filter(
        (registration) =>
          normalizeEmail(registration.userEmail) === normalizeEmail(userEmail) &&
          registration.attendanceStatus !== 'cancelled',
      )
      .map((registration) => String(registration.eventId)),
  );

const sortCalendarEvents = (left, right) => {
  const leftTime = new Date(left.startAt || left.date || 0).getTime();
  const rightTime = new Date(right.startAt || right.date || 0).getTime();

  return leftTime - rightTime;
};

const buildCalendarSummary = (events) => ({
  ongoing: events.filter((event) => event.calendarState === 'ongoing').length,
  coming: events.filter((event) => event.calendarState === 'coming').length,
  gone: events.filter((event) => event.calendarState === 'gone').length,
  total: events.length,
});

const buildGroupedCalendarEvents = (events) => ({
  ongoing: events.filter((event) => event.calendarState === 'ongoing'),
  coming: events.filter((event) => event.calendarState === 'coming'),
  gone: events.filter((event) => event.calendarState === 'gone'),
});

const getRoleScopedCalendarEvents = async ({ role, email, id }) => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);
  const now = new Date();

  let filteredEvents = events;

  if (role === 'user') {
    const registeredEventIds = getUserRegisteredEventIds(registrations, email);
    filteredEvents = events.filter((event) => registeredEventIds.has(String(event.id)));
  } else if (role === 'organizer') {
    filteredEvents = events.filter((event) =>
      eventBelongsToOrganizer(event, { email, id }),
    );
  }

  const calendarEvents = filteredEvents
    .map((event) => formatCalendarEvent(event, registrations, now))
    .sort(sortCalendarEvents);
  const groupedEvents = buildGroupedCalendarEvents(calendarEvents);

  return {
    events: calendarEvents,
    summary: buildCalendarSummary(calendarEvents),
    groupedEvents,
  };
};

module.exports = {
  getRoleScopedCalendarEvents,
};
