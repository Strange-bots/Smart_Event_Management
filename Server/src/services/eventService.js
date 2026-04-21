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

<<<<<<< HEAD
const getAllApprovedEvents = () => {
  const now = new Date();

  return events
    .filter((event) => event.status === 'approved')
    .sort((left, right) => getEventStart(left) - getEventStart(right))
    .map((event) => ({
      ...formatEvent(event),
      categoryLabel: event.category,
    }));
=======
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
>>>>>>> 35aaa4e5ddceb36e52a3557ae950fab40598e54d
};

module.exports = {
  getEvents,
  getNextUpcomingEvent,
  getRecommendedEvents,
  getAllApprovedEvents,
};
