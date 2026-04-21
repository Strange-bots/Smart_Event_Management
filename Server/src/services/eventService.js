const { events } = require('../data/events');

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

module.exports = {
  getNextUpcomingEvent,
  getRecommendedEvents,
};
