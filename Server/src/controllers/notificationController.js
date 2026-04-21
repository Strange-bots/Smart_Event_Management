const { getNotificationsForUser } = require('../services/notificationService');

const listOrganizerNotifications = (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = getNotificationsForUser(organizerEmail, 'organizer');

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Organizer notifications fetched successfully',
    organizer: result.user,
    notifications: result.notifications,
  });
};

module.exports = {
  listOrganizerNotifications,
};
