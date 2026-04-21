const {
  getNextUpcomingEvent,
  getRecommendedEvents,
} = require('../services/eventService');

const getNextEvent = (req, res) => {
  const event = getNextUpcomingEvent();

  if (!event) {
    return res.status(404).json({
      message: 'No upcoming approved events found',
    });
  }

  return res.json({ event });
};

const getRecommendations = (req, res) => {
  const recommendations = getRecommendedEvents();

  if (!recommendations.length) {
    return res.status(404).json({
      message: 'No recommended events available',
    });
  }

  return res.json({ recommendations });
};

module.exports = {
  getNextEvent,
  getRecommendations,
};
