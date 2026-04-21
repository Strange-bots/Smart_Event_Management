const { events } = require('../data/events');
const { registrations } = require('../data/registrations');
const { findUserByEmail, sanitizeUser } = require('./authService');

const formatRegistrationDate = (dateString) => {
  if (!dateString) {
    return '';
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
};

const getOrganizerRegistrationDetails = (organizerEmail) => {
  const organizer = findUserByEmail(organizerEmail);

  if (!organizer) {
    return {
      error: 'Organizer account not found',
      statusCode: 404,
    };
  }

  if (organizer.role !== 'organizer') {
    return {
      error: 'Only organizers can access registration details',
      statusCode: 403,
    };
  }

  const organizerEvents = events.filter(
    (event) => event.organizerEmail?.toLowerCase() === organizer.email.toLowerCase(),
  );

  const organizerEventMap = new Map(
    organizerEvents.map((event) => [event.id, event]),
  );

  const organizerRegistrations = registrations
    .filter((registration) => organizerEventMap.has(registration.eventId))
    .map((registration) => {
      const event = organizerEventMap.get(registration.eventId);

      return {
        id: registration.id,
        attendeeName: registration.userName,
        attendeeEmail: registration.userEmail,
        eventId: event.id,
        eventName: event.title,
        registrationDate: formatRegistrationDate(registration.registrationDate),
        paymentStatus: registration.paymentStatus,
        attendanceStatus: registration.attendanceStatus,
      };
    });

  return {
    statusCode: 200,
    organizer: sanitizeUser(organizer),
    registrations: organizerRegistrations,
  };
};

module.exports = {
  getOrganizerRegistrationDetails,
};
