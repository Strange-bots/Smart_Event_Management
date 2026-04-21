const { getOrganizerFeedbackDetails } = require('../services/feedbackService');

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

module.exports = {
  listOrganizerFeedback,
};
