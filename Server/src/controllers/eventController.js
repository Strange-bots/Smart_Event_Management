const {
  getEvents,
  getNextUpcomingEvent,
  getRecommendedEvents,
  getAllApprovedEvents,
  uploadAdminEventImage,
} = require('../services/eventService');

const listEvents = (req, res) => {
  const { category, search } = req.query ?? {};
  const events = getEvents({ category, search });

  return res.json({ events });
};

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

const uploadEventImage = (req, res) => {
  const adminEmail = req.headers['x-user-email'];

  if (!adminEmail) {
    return res.status(401).json({
      message: 'Admin email is required',
    });
  }

  const result = uploadAdminEventImage({
    adminEmail,
    eventId: req.params.eventId,
    imageData: req.body?.imageData,
  });

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Event image uploaded successfully',
    event: result.event,
    imageUrl: result.imageUrl,
  });
};

module.exports = {
  listEvents,
  getNextEvent,
  getRecommendations,
  getAllEvents,
  uploadEventImage,
};
