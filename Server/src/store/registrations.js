const { events } = require('./events');

const registrations = events.flatMap((event) =>
  (Array.isArray(event.attendees) ? event.attendees : []).map((attendee) => ({
    ...attendee,
    eventId: event.id,
  })),
);

module.exports = {
  registrations,
};
