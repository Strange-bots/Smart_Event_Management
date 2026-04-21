const {
  getNextUpcomingEvent,
  getRecommendedEvents,
  getAllApprovedEvents,
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

const getAllEvents = (req, res) => {
  const allEvents = getAllApprovedEvents();

  return res.json({
    success: true,
    data: allEvents,
  });
};

module.exports = {
  getNextEvent,
  getRecommendations,
  getAllEvents,
};
