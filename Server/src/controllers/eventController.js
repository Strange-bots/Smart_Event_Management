const { getNextUpcomingEvent } = require('../services/eventService');

const getNextEvent = (req, res) => {
  const event = getNextUpcomingEvent();

  if (!event) {
    return res.status(404).json({
      message: 'No upcoming approved events found',
    });
  }

  return res.json({ event });
};

module.exports = {
  getNextEvent,
};
