const { readCollection, writeCollection } = require('../database/collections');
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

const getNotificationsForUser = async (userEmail, requiredRole) => {
  const user = await findUserByEmail(userEmail);

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

  const notifications = await readCollection('notifications');
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
      body: notification.body || notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      createdAtLabel: formatNotificationDateTime(notification.createdAt),
      from: notification.from,
      fromEmail: notification.fromEmail || null,
      recipientName: user.name,
      recipientEmail: user.email,
      relatedEntityType: notification.relatedEntityType || null,
      relatedEntityId: notification.relatedEntityId || null,
    }));

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    notifications: userNotifications,
  };
};

const markNotificationAsRead = async (userEmail, notificationId, requiredRole) => {
  const user = await findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  if (requiredRole && user.role !== requiredRole) {
    return {
      error: `Only ${requiredRole}s can update this notification feed`,
      statusCode: 403,
    };
  }

  const notifications = await readCollection('notifications');
  const notification = notifications.find(
    (item) =>
      item.id === notificationId &&
      item.userEmail.toLowerCase() === user.email.toLowerCase(),
  );

  if (!notification) {
    return {
      error: 'Notification not found',
      statusCode: 404,
    };
  }

  notification.isRead = true;
  await writeCollection('notifications', notifications);

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    notification: {
      id: notification.id,
      isRead: notification.isRead,
    },
  };
};

const markAllNotificationsAsRead = async (userEmail, requiredRole) => {
  const user = await findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  if (requiredRole && user.role !== requiredRole) {
    return {
      error: `Only ${requiredRole}s can update this notification feed`,
      statusCode: 403,
    };
  }

  const notifications = await readCollection('notifications');
  let updatedCount = 0;

  notifications.forEach((notification) => {
    if (
      notification.userEmail.toLowerCase() === user.email.toLowerCase() &&
      !notification.isRead
    ) {
      notification.isRead = true;
      updatedCount += 1;
    }
  });
  await writeCollection('notifications', notifications);

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    updatedCount,
  };
};

module.exports = {
  getNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
};
