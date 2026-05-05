const { readCollection, writeCollection } = require('../database/collections');
const { findUserByEmail, sanitizeUser, listUsers } = require('./authService');

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

const getUsersByRole = (users, role) =>
  users.filter((user) => user.role === role);

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
  notifications,
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
  messages,
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

const listSentMessages = async (userEmail, allowedRoles = ['user', 'organizer', 'admin']) => {
  const user = await findUserByEmail(userEmail);

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

  const emailLogs = await readCollection('emailLogs');

  return {
    statusCode: 200,
    user: sanitizeUser(user),
    logs: emailLogs
      .filter((log) => normalizeEmail(log.senderEmail) === normalizeEmail(user.email))
      .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt))
      .map(formatEmailLog),
  };
};

const getAdminRecipientGroup = (users, recipientGroup) => {
  const userGroup = getUsersByRole(users, 'user');
  const organizerGroup = getUsersByRole(users, 'organizer');
  const everyone = dedupeUsers([...userGroup, ...organizerGroup]);

  switch (recipientGroup) {
    case 'all-users':
      return {
        label: 'All Users',
        recipients: userGroup,
      };
    case 'all-organizers':
      return {
        label: 'All Organizers',
        recipients: organizerGroup,
      };
    case 'all':
      return {
        label: 'Everyone',
        recipients: everyone,
      };
    default:
      return null;
  }
};

const listAdminMessageLogs = async (adminEmail) => {
  const admin = await findUserByEmail(adminEmail);

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

  const emailLogs = await readCollection('emailLogs');

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
  const [admin, users, emailLogs, messages, notifications] = await Promise.all([
    findUserByEmail(adminEmail),
    listUsers(),
    readCollection('emailLogs'),
    readCollection('messages'),
    readCollection('notifications'),
  ]);

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

  const group = getAdminRecipientGroup(users, recipientGroup);

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
      messages,
      sender: admin,
      recipient,
      subject: normalizedSubject,
      body: normalizedBody,
      relatedEntityType: 'broadcast',
      relatedEntityId: null,
    });
    createNotificationRecord({
      notifications,
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

  await Promise.all([
    writeCollection('emailLogs', emailLogs),
    writeCollection('messages', messages),
    writeCollection('notifications', notifications),
  ]);

  return {
    statusCode: 201,
    admin: sanitizeUser(admin),
    log: formatEmailLog(log),
    recipientCount: recipients.length,
  };
};

const getOrganizerAudienceRecipients = async (users, registrations, eventId, audience) => {
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

  const recipients = filtered
    .map((registration) =>
      users.find((user) => normalizeEmail(user.email) === normalizeEmail(registration.userEmail)),
    )
    .filter(Boolean);

  return dedupeUsers(recipients);
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

const createDirectMessageLog = ({
  emailLogs,
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
    organizerEmail:
      sender.role === 'organizer' ? sender.email : recipient.role === 'organizer' ? recipient.email : null,
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
  const [sender, recipient, events, registrations, emailLogs, messages, notifications] =
    await Promise.all([
      findUserByEmail(senderEmail),
      findUserByEmail(recipientEmail),
      readCollection('events'),
      readCollection('registrations'),
      readCollection('emailLogs'),
      readCollection('messages'),
      readCollection('notifications'),
    ]);

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

  if (sender.role === 'user' && relatedEvent) {
    if (
      normalizeEmail(relatedEvent.organizerEmail || relatedEvent.organizerId) !==
      normalizeEmail(recipient.email)
    ) {
      return {
        error: 'Selected organizer does not own the related event',
        statusCode: 400,
      };
    }

    if (
      !registrations.find(
        (registration) =>
          String(registration.eventId) === String(relatedEvent.id) &&
          normalizeEmail(registration.userEmail) === normalizeEmail(sender.email),
      )
    ) {
      return {
        error: 'You can only message organizers for events you registered for',
        statusCode: 403,
      };
    }
  }

  if (sender.role === 'organizer' && relatedEvent) {
    if (
      normalizeEmail(relatedEvent.organizerEmail || relatedEvent.organizerId) !==
      normalizeEmail(sender.email)
    ) {
      return {
        error: 'You can only message users about events you organize',
        statusCode: 403,
      };
    }

    if (
      !registrations.find(
        (registration) =>
          String(registration.eventId) === String(relatedEvent.id) &&
          normalizeEmail(registration.userEmail) === normalizeEmail(recipient.email),
      )
    ) {
      return {
        error: 'Recipient is not registered for the selected event',
        statusCode: 400,
      };
    }
  }

  const log = createDirectMessageLog({
    emailLogs,
    sender,
    recipient,
    subject: normalizedSubject,
    body: normalizedBody,
    event: relatedEvent,
  });

  createInboxMessageRecord({
    messages,
    sender,
    recipient,
    subject: normalizedSubject,
    body: normalizedBody,
    relatedEntityType: relatedEvent ? 'event' : 'direct',
    relatedEntityId: relatedEvent?.id ?? null,
  });

  createNotificationRecord({
    notifications,
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

  await Promise.all([
    writeCollection('emailLogs', emailLogs),
    writeCollection('messages', messages),
    writeCollection('notifications', notifications),
  ]);

  return {
    statusCode: 201,
    sender: sanitizeUser(sender),
    recipient: sanitizeUser(recipient),
    log: formatEmailLog(log),
  };
};

const listOrganizerMessageLogs = async (organizerEmail) => {
  const organizer = await findUserByEmail(organizerEmail);

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

  const emailLogs = await readCollection('emailLogs');

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
  const [organizer, users, events, registrations, emailLogs, messages, notifications] =
    await Promise.all([
      findUserByEmail(organizerEmail),
      listUsers(),
      readCollection('events'),
      readCollection('registrations'),
      readCollection('emailLogs'),
      readCollection('messages'),
      readCollection('notifications'),
    ]);

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

  const event = events.find(
    (item) =>
      String(item.id) === String(eventId) &&
      normalizeEmail(item.organizerEmail || item.organizerId) === normalizeEmail(organizer.email),
  );

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

  const recipients = await getOrganizerAudienceRecipients(users, registrations, event.id, audience);

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
      messages,
      sender: organizer,
      recipient,
      subject: normalizedSubject,
      body: normalizedBody,
      relatedEntityType: 'event',
      relatedEntityId: event.id,
    });
    createNotificationRecord({
      notifications,
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

  await Promise.all([
    writeCollection('emailLogs', emailLogs),
    writeCollection('messages', messages),
    writeCollection('notifications', notifications),
  ]);

  return {
    statusCode: 201,
    organizer: sanitizeUser(organizer),
    log: formatEmailLog(log),
    recipientCount: recipients.length,
  };
};

const listInboxMessages = async (userEmail) => {
  const user = await findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  const messages = await readCollection('messages');

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
