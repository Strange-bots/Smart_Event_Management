const {
  getOrganizerFeedbackDetails,
  submitFeedback,
} = require('../services/feedbackService');

const listOrganizerFeedback = (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = getOrganizerFeedbackDetails(organizerEmail);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Organizer feedback fetched successfully',
    organizer: result.organizer,
    feedback: result.feedback,
    analytics: result.analytics,
  });
};

const createFeedback = (req, res) => {
  const attendeeEmail = req.user?.email || req.headers['x-user-email'];

  if (!attendeeEmail) {
    return res.status(401).json({
      message: 'Authentication is required',
    });
  }

  const result = submitFeedback({
    userEmail: attendeeEmail,
    eventId: req.body?.eventId,
    rating: req.body?.rating,
    comment: req.body?.comment,
    isAnonymous: req.body?.isAnonymous,
  });

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(result.statusCode).json({
    message:
      result.statusCode === 201
        ? 'Feedback submitted successfully'
        : 'Feedback updated successfully',
    feedback: result.feedback,
  });
};

module.exports = {
  createFeedback,
  listOrganizerFeedback,
};
