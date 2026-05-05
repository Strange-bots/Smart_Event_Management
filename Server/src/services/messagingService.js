const { emailLogs } = require('../store/emailLogs');
const { messages } = require('../store/messages');
const { notifications } = require('../store/notifications');
const { registeredUsers } = require('../store/registeredUsers');
const { events } = require('../store/events');
const { registrations } = require('../store/registrations');
const { persistCollection } = require('../store/mongoSync');
const { findUserByEmail, sanitizeUser } = require('./authService');

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const formatDateTimeLabel = (dateString) => {
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
  const normalizedBody = String(body || '').replace(/\s+/g, ' ').trim();

  if (!normalizedBody) {
    return '';
  }

  if (normalizedBody.length <= 160) {
    return normalizedBody;
  }

  return `${normalizedBody.slice(0, 157)}...`;
};

const getAllPlatformUsers = () => registeredUsers;

const getUsersByRole = (role) =>
  getAllPlatformUsers().filter((user) => user.role === role);

const dedupeUsers = (users) => {
  const seen = new Set();

  return users.filter((user) => {
    const email = normalizeEmail(user.email);

    if (!email || seen.has(email)) {
      return false;
    }

    seen.add(email);
    return true;
  });
};

const createNotificationRecord = ({
  user,
  title,
  message,
  body = null,
  type,
  from,
  fromEmail = null,
  relatedEntityType = null,
  relatedEntityId = null,
}) => {
  notifications.unshift({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userEmail: user.email,
    role: user.role,
    type,
    title,
    message,
    body,
    isRead: false,
    createdAt: new Date().toISOString(),
    from,
    fromEmail,
    relatedEntityType,
    relatedEntityId,
  });
};

const createInboxMessageRecord = ({
  sender,
  recipient,
  subject,
  body,
  relatedEntityType = null,
  relatedEntityId = null,
}) => {
  messages.unshift({
    id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderEmail: sender.email,
    senderName: sender.name,
    senderRole: sender.role,
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    recipientRole: recipient.role,
    subject,
    body,
    sentAt: new Date().toISOString(),
    isRead: false,
    relatedEntityType,
    relatedEntityId,
  });
};

const formatEmailLog = (log) => ({
  id: log.id,
  recipient: log.recipient,
  recipientGroup: log.recipientGroup || null,
  recipientCount: Number(log.recipientCount || 0),
  audience: log.audience || null,
  subject: log.subject,
  bodyPreview: buildMessagePreview(log.body),
  body: log.body,
  status: log.status || 'sent',
  sentAt: log.sentAt,
  sentAtLabel: formatDateTimeLabel(log.sentAt),
  eventId: log.eventId || null,
  eventTitle: log.eventTitle || null,
  senderName: log.senderName || null,
  senderRole: log.senderRole || null,
});

const formatInboxMessage = (message) => ({
  ...message,
  sentAtLabel: formatDateTimeLabel(message.sentAt),
  bodyPreview: buildMessagePreview(message.body),
});

const listSentMessages = (userEmail, allowedRoles = ['user', 'organizer', 'admin']) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      error: 'This account cannot access sent messages',
      statusCode: 403,
    };
  }

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    logs: emailLogs
      .filter((log) => normalizeEmail(log.senderEmail) === normalizeEmail(user.email))
      .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt))
      .map(formatEmailLog),
  };
};

const getAdminRecipientContext = () => {
  const users = getUsersByRole('user');
  const organizers = getUsersByRole('organizer');
  const everyone = dedupeUsers([...users, ...organizers]);

  return {
    users,
    organizers,
    everyone,
  };
};

const getAdminRecipientGroup = (recipientGroup) => {
  const groups = getAdminRecipientContext();

  switch (recipientGroup) {
    case 'all-users':
      return {
        label: 'All Users',
        recipients: groups.users,
      };
    case 'all-organizers':
      return {
        label: 'All Organizers',
        recipients: groups.organizers,
      };
    case 'all':
      return {
        label: 'Everyone',
        recipients: groups.everyone,
      };
    default:
      return null;
  }
};

const listAdminMessageLogs = (adminEmail) => {
  const admin = findUserByEmail(adminEmail);

  if (!admin) {
    return {
      error: 'Admin account not found',
      statusCode: 404,
    };
  }

  if (admin.role !== 'admin') {
    return {
      error: 'Only admins can access message logs',
      statusCode: 403,
    };
  }

  return {
    statusCode: 200,
    admin: sanitizeUser(admin),
    logs: emailLogs
      .filter((log) => normalizeEmail(log.senderEmail) === normalizeEmail(admin.email))
      .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt))
      .map(formatEmailLog),
  };
};

const sendAdminMessage = async ({ adminEmail, recipientGroup, subject, body }) => {
  const admin = findUserByEmail(adminEmail);

  if (!admin) {
    return {
      error: 'Admin account not found',
      statusCode: 404,
    };
  }

  if (admin.role !== 'admin') {
    return {
      error: 'Only admins can send platform-wide messages',
      statusCode: 403,
    };
  }

  const normalizedSubject = String(subject || '').trim();
  const normalizedBody = String(body || '').trim();

  if (!recipientGroup) {
    return {
      error: 'Recipient group is required',
      statusCode: 400,
    };
  }

  if (!normalizedSubject || !normalizedBody) {
    return {
      error: 'Subject and message body are required',
      statusCode: 400,
    };
  }

  const group = getAdminRecipientGroup(recipientGroup);

  if (!group) {
    return {
      error: 'Recipient group is invalid',
      statusCode: 400,
    };
  }

  const recipients = dedupeUsers(group.recipients);

  const log = {
    id: `email-log-${Date.now()}`,
    senderEmail: admin.email,
    senderName: admin.name,
    senderRole: admin.role,
    recipientGroup,
    recipient: group.label,
    recipientCount: recipients.length,
    subject: normalizedSubject,
    body: normalizedBody,
    status: 'sent',
    sentAt: new Date().toISOString(),
  };

  emailLogs.unshift(log);

  recipients.forEach((recipient) => {
    createInboxMessageRecord({
      sender: admin,
      recipient,
      subject: normalizedSubject,
      body: normalizedBody,
      relatedEntityType: 'broadcast',
      relatedEntityId: null,
    });
    createNotificationRecord({
      user: recipient,
      title: normalizedSubject,
      message: buildMessagePreview(normalizedBody),
      body: normalizedBody,
      type: 'adminMessage',
      from: admin.name,
      fromEmail: admin.email,
      relatedEntityType: 'broadcast',
      relatedEntityId: null,
    });
  });
  await persistCollection('emailLogs');
  await persistCollection('messages');
  await persistCollection('notifications');

  return {
    statusCode: 201,
    admin: sanitizeUser(admin),
    log: formatEmailLog(log),
    recipientCount: recipients.length,
  };
};

const getOrganizerOwnedEvent = (organizerEmail, eventId) =>
  events.find(
    (event) =>
      String(event.id) === String(eventId) &&
      normalizeEmail(event.organizerEmail || event.organizerId) === normalizeEmail(organizerEmail),
  );

const getOrganizerAudienceRecipients = (eventId, audience) => {
  const registrationsForEvent = registrations.filter(
    (registration) => String(registration.eventId) === String(eventId),
  );

  const filtered = registrationsForEvent.filter((registration) => {
    switch (audience) {
      case 'all':
        return registration.attendanceStatus !== 'cancelled';
      case 'paid':
        return (
          registration.paymentStatus === 'paid' &&
          registration.attendanceStatus !== 'cancelled'
        );
      case 'cancelled':
        return registration.attendanceStatus === 'cancelled';
      case 'attended':
        return registration.attendanceStatus === 'attended';
      case 'no-show':
        return registration.attendanceStatus === 'no-show';
      default:
        return false;
    }
  });

  const users = filtered
    .map((registration) => findUserByEmail(registration.userEmail))
    .filter(Boolean);

  return dedupeUsers(users);
};

const getOrganizerAudienceLabel = (audience) => {
  switch (audience) {
    case 'all':
      return 'All Registrants';
    case 'paid':
      return 'Paid Only';
    case 'cancelled':
      return 'Cancelled';
    case 'attended':
      return 'Attended';
    case 'no-show':
      return 'No-Shows';
    default:
      return audience;
  }
};

const getUserRegisteredEvent = (userEmail, eventId) =>
  registrations.find(
    (registration) =>
      String(registration.eventId) === String(eventId) &&
      normalizeEmail(registration.userEmail) === normalizeEmail(userEmail),
  );

const createDirectMessageLog = ({
  sender,
  recipient,
  subject,
  body,
  event,
}) => {
  const log = {
    id: `email-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderEmail: sender.email,
    senderName: sender.name,
    senderRole: sender.role,
    organizerEmail: sender.role === 'organizer' ? sender.email : recipient.role === 'organizer' ? recipient.email : null,
    recipient: `${recipient.name} <${recipient.email}>`,
    recipientGroup: 'direct',
    recipientCount: 1,
    audience: 'direct',
    subject,
    body,
    status: 'sent',
    sentAt: new Date().toISOString(),
    eventId: event?.id ?? null,
    eventTitle: event?.title ?? null,
  };

  emailLogs.unshift(log);
  return log;
};

const sendDirectMessage = async ({
  senderEmail,
  recipientEmail,
  subject,
  body,
  eventId = null,
}) => {
  const sender = findUserByEmail(senderEmail);
  const recipient = findUserByEmail(recipientEmail);

  if (!sender) {
    return {
      error: 'Sender account not found',
      statusCode: 404,
    };
  }

  if (!recipient) {
    return {
      error: 'Recipient account not found',
      statusCode: 404,
    };
  }

  const supportedRoles = new Set(['user', 'organizer']);

  if (!supportedRoles.has(sender.role) || !supportedRoles.has(recipient.role)) {
    return {
      error: 'Direct messaging is only available between users and organizers',
      statusCode: 403,
    };
  }

  if (sender.role === recipient.role) {
    return {
      error: 'Direct messaging currently requires one user and one organizer',
      statusCode: 400,
    };
  }

  const normalizedSubject = String(subject || '').trim();
  const normalizedBody = String(body || '').trim();

  if (!normalizedSubject || !normalizedBody) {
    return {
      error: 'Subject and message body are required',
      statusCode: 400,
    };
  }

  let relatedEvent = null;

  if (eventId) {
    relatedEvent = events.find((event) => String(event.id) === String(eventId)) || null;

    if (!relatedEvent) {
      return {
        error: 'Related event not found',
        statusCode: 404,
      };
    }
  }

  if (sender.role === 'user') {
    const organizerTarget = recipient;

    if (relatedEvent) {
      if (normalizeEmail(relatedEvent.organizerEmail || relatedEvent.organizerId) !== normalizeEmail(organizerTarget.email)) {
        return {
          error: 'Selected organizer does not own the related event',
          statusCode: 400,
        };
      }

      if (!getUserRegisteredEvent(sender.email, relatedEvent.id)) {
        return {
          error: 'You can only message organizers for events you registered for',
          statusCode: 403,
        };
      }
    }
  }

  if (sender.role === 'organizer') {
    const userTarget = recipient;

    if (relatedEvent) {
      if (normalizeEmail(relatedEvent.organizerEmail || relatedEvent.organizerId) !== normalizeEmail(sender.email)) {
        return {
          error: 'You can only message users about events you organize',
          statusCode: 403,
        };
      }

      if (!getUserRegisteredEvent(userTarget.email, relatedEvent.id)) {
        return {
          error: 'Recipient is not registered for the selected event',
          statusCode: 400,
        };
      }
    }
  }

  const log = createDirectMessageLog({
    sender,
    recipient,
    subject: normalizedSubject,
    body: normalizedBody,
    event: relatedEvent,
  });

  createInboxMessageRecord({
    sender,
    recipient,
    subject: normalizedSubject,
    body: normalizedBody,
    relatedEntityType: relatedEvent ? 'event' : 'direct',
    relatedEntityId: relatedEvent?.id ?? null,
  });

  createNotificationRecord({
    user: recipient,
    title: normalizedSubject,
    message: buildMessagePreview(normalizedBody),
    body: normalizedBody,
    type: sender.role === 'organizer' ? 'organizerMessage' : 'userMessage',
    from: sender.name,
    fromEmail: sender.email,
    relatedEntityType: relatedEvent ? 'event' : 'direct',
    relatedEntityId: relatedEvent?.id ?? null,
  });
  await persistCollection('emailLogs');
  await persistCollection('messages');
  await persistCollection('notifications');

  return {
    statusCode: 201,
    sender: sanitizeUser(sender),
    recipient: sanitizeUser(recipient),
    log: formatEmailLog(log),
  };
};

const listOrganizerMessageLogs = (organizerEmail) => {
  const organizer = findUserByEmail(organizerEmail);

  if (!organizer) {
    return {
      error: 'Organizer account not found',
      statusCode: 404,
    };
  }

  if (organizer.role !== 'organizer') {
    return {
      error: 'Only organizers can access email logs',
      statusCode: 403,
    };
  }

  return {
    statusCode: 200,
    organizer: sanitizeUser(organizer),
    logs: emailLogs
      .filter((log) => normalizeEmail(log.organizerEmail || log.senderEmail) === normalizeEmail(organizer.email))
      .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt))
      .map(formatEmailLog),
  };
};

const sendOrganizerMessage = async ({ organizerEmail, eventId, audience, subject, body }) => {
  const organizer = findUserByEmail(organizerEmail);

  if (!organizer) {
    return {
      error: 'Organizer account not found',
      statusCode: 404,
    };
  }

  if (organizer.role !== 'organizer') {
    return {
      error: 'Only organizers can send event messages',
      statusCode: 403,
    };
  }

  const event = getOrganizerOwnedEvent(organizer.email, eventId);

  if (!event) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  const normalizedSubject = String(subject || '').trim();
  const normalizedBody = String(body || '').trim();

  if (!audience) {
    return {
      error: 'Audience is required',
      statusCode: 400,
    };
  }

  if (!normalizedSubject || !normalizedBody) {
    return {
      error: 'Subject and message body are required',
      statusCode: 400,
    };
  }

  const recipients = getOrganizerAudienceRecipients(event.id, audience);

  if (!recipients.length) {
    return {
      error: 'No recipients matched the selected audience',
      statusCode: 400,
    };
  }

  const log = {
    id: `email-log-${Date.now()}`,
    organizerEmail: organizer.email,
    senderEmail: organizer.email,
    senderName: organizer.name,
    senderRole: organizer.role,
    eventId: event.id,
    eventTitle: event.title,
    audience,
    recipient: getOrganizerAudienceLabel(audience),
    recipientCount: recipients.length,
    subject: normalizedSubject,
    body: normalizedBody,
    status: 'sent',
    sentAt: new Date().toISOString(),
  };

  emailLogs.unshift(log);

  recipients.forEach((recipient) => {
    createInboxMessageRecord({
      sender: organizer,
      recipient,
      subject: normalizedSubject,
      body: normalizedBody,
      relatedEntityType: 'event',
      relatedEntityId: event.id,
    });
    createNotificationRecord({
      user: recipient,
      title: normalizedSubject,
      message: buildMessagePreview(normalizedBody),
      body: normalizedBody,
      type: 'organizerMessage',
      from: organizer.name,
      fromEmail: organizer.email,
      relatedEntityType: 'event',
      relatedEntityId: event.id,
    });
  });
  await persistCollection('emailLogs');
  await persistCollection('messages');
  await persistCollection('notifications');

  return {
    statusCode: 201,
    organizer: sanitizeUser(organizer),
    log: formatEmailLog(log),
    recipientCount: recipients.length,
  };
};

const listInboxMessages = (userEmail) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    messages: messages
      .filter((message) => normalizeEmail(message.recipientEmail) === normalizeEmail(user.email))
      .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt))
      .map(formatInboxMessage),
  };
};

module.exports = {
  listAdminMessageLogs,
  listInboxMessages,
  listOrganizerMessageLogs,
  listSentMessages,
  sendAdminMessage,
  sendDirectMessage,
  sendOrganizerMessage,
};
