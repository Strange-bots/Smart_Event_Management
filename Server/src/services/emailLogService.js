const { emailLogs } = require('../store/emailLogs');
const { findUserByEmail, sanitizeUser } = require('./authService');

const formatDateTime = (dateString) => {
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

const buildMessagePreview = (body) => {
  if (!body) {
    return '';
  }

  const normalizedBody = body.replace(/\s+/g, ' ').trim();

  if (normalizedBody.length <= 160) {
    return normalizedBody;
  }

  return `${normalizedBody.slice(0, 157)}...`;
};

const getEmailLogsForUser = (userEmail, requiredRole) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  if (requiredRole && user.role !== requiredRole) {
    return {
      error: `Only ${requiredRole}s can access this email log`,
      statusCode: 403,
    };
  }

  const userEmailLogs = emailLogs
    .filter((log) => log.organizerEmail.toLowerCase() === user.email.toLowerCase())
    .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt))
    .map((log) => ({
      id: log.id,
      recipient: log.recipient,
      recipientCount: log.recipientCount,
      audience: log.audience,
      subject: log.subject,
      bodyPreview: buildMessagePreview(log.body),
      body: log.body,
      status: log.status,
      sentAt: log.sentAt,
      sentAtLabel: formatDateTime(log.sentAt),
      eventId: log.eventId || null,
      eventTitle: log.eventTitle || null,
      senderName: log.senderName || user.name,
    }));

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    emailLogs: userEmailLogs,
  };
};

module.exports = {
  getEmailLogsForUser,
};
