const { notifications } = require('../data/notifications');
const { findUserByEmail, sanitizeUser } = require('./authService');

const formatNotificationDateTime = (dateString) => {
  if (!dateString) {
    return '';
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsedDate);
};

const getNotificationsForUser = (userEmail, requiredRole) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  if (requiredRole && user.role !== requiredRole) {
    return {
      error: `Only ${requiredRole}s can access this notification feed`,
      statusCode: 403,
    };
  }

  const userNotifications = notifications
    .filter(
      (notification) =>
        notification.userEmail.toLowerCase() === user.email.toLowerCase(),
    )
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      createdAtLabel: formatNotificationDateTime(notification.createdAt),
      from: notification.from,
      relatedEntityType: notification.relatedEntityType || null,
      relatedEntityId: notification.relatedEntityId || null,
    }));

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    notifications: userNotifications,
  };
};

module.exports = {
  getNotificationsForUser,
};
