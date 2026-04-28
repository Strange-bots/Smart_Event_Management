const {
  getNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} = require('../services/notificationService');

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

const listMyNotifications = (req, res) => {
  const result = getNotificationsForUser(req.user?.email);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Notifications fetched successfully',
    user: result.user,
    notifications: result.notifications,
  });
};

const updateMyNotificationReadStatus = (req, res) => {
  const result = markNotificationAsRead(
    req.user?.email,
    req.params.notificationId,
  );

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Notification marked as read',
    user: result.user,
    notification: result.notification,
  });
};

const markAllMyNotificationsRead = (req, res) => {
  const result = markAllNotificationsAsRead(req.user?.email);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'All notifications marked as read',
    user: result.user,
    updatedCount: result.updatedCount,
  });
};

const updateOrganizerNotificationReadStatus = (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = markNotificationAsRead(
    organizerEmail,
    req.params.notificationId,
    'organizer',
  );

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Notification marked as read',
    organizer: result.user,
    notification: result.notification,
  });
};

const markAllOrganizerNotificationsRead = (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = markAllNotificationsAsRead(organizerEmail, 'organizer');

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'All organizer notifications marked as read',
    organizer: result.user,
    updatedCount: result.updatedCount,
  });
};

module.exports = {
  listMyNotifications,
  listOrganizerNotifications,
  markAllMyNotificationsRead,
  markAllOrganizerNotificationsRead,
  updateMyNotificationReadStatus,
  updateOrganizerNotificationReadStatus,
};
