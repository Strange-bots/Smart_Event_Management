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
  getAllApprovedEvents,
  updateAdminEventStatus,
  updateOrganizerEvent,
  uploadAdminEventImage,
} = require('../services/eventService');

const listEvents = async (req, res) => {
  const { category, search } = req.query ?? {};
  const events = await getEvents({ category, search });

  return res.json({ events });
};

const getNextEvent = async (req, res) => {
  const event = await getNextUpcomingEvent();

  if (!event) {
    return res.status(404).json({
      message: 'No upcoming approved events found',
    });
  }

  return res.json({ event });
};

const getFeaturedEventsList = async (req, res) => {
  const featuredEvents = await getFeaturedEvents();

  if (!featuredEvents.length) {
    return res.status(404).json({
      message: 'No featured events available',
      featuredEvents: [],
    });
  }

  return res.json({ featuredEvents });
};

const getAllEvents = async (req, res) => {
  const allEvents = await getAllApprovedEvents();

  return res.json({
    success: true,
    data: allEvents,
  });
};

const listAdminEvents = async (req, res) => {
  return res.status(200).json({
    message: 'Admin events fetched successfully',
    events: await getAdminEvents(),
  });
};

const listAdminGalleryImages = async (req, res) => {
  return res.status(200).json({
    message: 'Admin gallery images fetched successfully',
    images: await getAdminGalleryImages(),
  });
};

const approveAdminEventRecord = async (req, res) => {
  const result = await updateAdminEventStatus({
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

const rejectAdminEventRecord = async (req, res) => {
  const result = await updateAdminEventStatus({
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

const deleteAdminEventRecord = async (req, res) => {
  const result = await deleteAdminEvent(req.params.eventId);

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Event deleted successfully',
  });
};

const deleteAdminEventImageRecord = async (req, res) => {
  const result = await deleteAdminEventImage(req.params.eventId);

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Event image deleted successfully',
    event: result.event,
  });
};

const uploadEventImage = async (req, res) => {
  const adminEmail = req.headers['x-user-email'];

  if (!adminEmail) {
    return res.status(401).json({
      message: 'Admin email is required',
    });
  }

  const result = await uploadAdminEventImage({
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

const listOrganizerEvents = async (req, res) => {
  return res.status(200).json({
    message: 'Organizer events fetched successfully',
    events: await getOrganizerEvents(req.user.email),
  });
};

const createOrganizerEventRecord = async (req, res) => {
  const result = await createOrganizerEvent({
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

const updateOrganizerEventRecord = async (req, res) => {
  const result = await updateOrganizerEvent({
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

const duplicateOrganizerEventRecord = async (req, res) => {
  const result = await duplicateOrganizerEvent({
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

const deleteOrganizerEventRecord = async (req, res) => {
  const result = await deleteOrganizerEvent({
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
  getAllEvents,
  listOrganizerEvents,
  rejectAdminEventRecord,
  updateOrganizerEventRecord,
  uploadEventImage,
};
