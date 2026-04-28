const {
  deleteAdminEvent,
  deleteAdminEventImage,
  createOrganizerEvent,
  deleteOrganizerEvent,
  duplicateOrganizerEvent,
  getAdminEvents,
  getAdminGalleryImages,
  getEvents,
  getFeaturedEvents,
  getNextUpcomingEvent,
  getOrganizerEvents,
  getRecommendedEvents,
  getAllApprovedEvents,
  updateAdminEventStatus,
  updateOrganizerEvent,
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

const getFeaturedEventsList = (req, res) => {
  const featuredEvents = getFeaturedEvents();

  if (!featuredEvents.length) {
    return res.status(404).json({
      message: 'No featured events available',
      featuredEvents: [],
    });
  }

  return res.json({ featuredEvents });
};

const getAllEvents = (req, res) => {
  const allEvents = getAllApprovedEvents();

  return res.json({
    success: true,
    data: allEvents,
  });
};

const listAdminEvents = (req, res) => {
  return res.status(200).json({
    message: 'Admin events fetched successfully',
    events: getAdminEvents(),
  });
};

const listAdminGalleryImages = (req, res) => {
  return res.status(200).json({
    message: 'Admin gallery images fetched successfully',
    images: getAdminGalleryImages(),
  });
};

const approveAdminEventRecord = (req, res) => {
  const result = updateAdminEventStatus({
    eventId: req.params.eventId,
    status: 'approved',
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Event approved successfully',
    event: result.event,
  });
};

const rejectAdminEventRecord = (req, res) => {
  const result = updateAdminEventStatus({
    eventId: req.params.eventId,
    status: 'rejected',
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Event rejected successfully',
    event: result.event,
  });
};

const deleteAdminEventRecord = (req, res) => {
  const result = deleteAdminEvent(req.params.eventId);

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Event deleted successfully',
  });
};

const deleteAdminEventImageRecord = (req, res) => {
  const result = deleteAdminEventImage(req.params.eventId);

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Event image deleted successfully',
    event: result.event,
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

const listOrganizerEvents = (req, res) => {
  return res.status(200).json({
    message: 'Organizer events fetched successfully',
    events: getOrganizerEvents(req.user.email),
  });
};

const createOrganizerEventRecord = (req, res) => {
  const result = createOrganizerEvent({
    organizer: req.user,
    payload: req.body ?? {},
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Event created successfully',
    event: result.event,
  });
};

const updateOrganizerEventRecord = (req, res) => {
  const result = updateOrganizerEvent({
    organizerEmail: req.user.email,
    eventId: req.params.eventId,
    payload: req.body ?? {},
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Event updated successfully',
    event: result.event,
  });
};

const duplicateOrganizerEventRecord = (req, res) => {
  const result = duplicateOrganizerEvent({
    organizer: req.user,
    eventId: req.params.eventId,
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Event duplicated successfully',
    event: result.event,
  });
};

const deleteOrganizerEventRecord = (req, res) => {
  const result = deleteOrganizerEvent({
    organizerEmail: req.user.email,
    eventId: req.params.eventId,
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Event deleted successfully',
  });
};

module.exports = {
  approveAdminEventRecord,
  createOrganizerEventRecord,
  deleteAdminEventRecord,
  deleteAdminEventImageRecord,
  deleteOrganizerEventRecord,
  duplicateOrganizerEventRecord,
  getFeaturedEventsList,
  listEvents,
  listAdminEvents,
  listAdminGalleryImages,
  getNextEvent,
  getRecommendations,
  getAllEvents,
  listOrganizerEvents,
  rejectAdminEventRecord,
  updateOrganizerEventRecord,
  uploadEventImage,
};
