const {
  listAdminMessageLogs,
  listInboxMessages,
  listOrganizerMessageLogs,
  listSentMessages,
  sendAdminMessage,
  sendDirectMessage,
  sendOrganizerMessage,
} = require('../services/messagingService');

const listAdminMessages = (req, res) => {
  const result = listAdminMessageLogs(req.user?.email);

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Admin message logs fetched successfully',
    admin: result.admin,
    emailLogs: result.logs,
  });
};

const createAdminMessage = async (req, res) => {
  const result = await sendAdminMessage({
    adminEmail: req.user?.email,
    recipientGroup: req.body?.recipientGroup,
    subject: req.body?.subject,
    body: req.body?.body,
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Admin message sent successfully',
    log: result.log,
    recipientCount: result.recipientCount,
  });
};

const listOrganizerMessages = (req, res) => {
  const result = listOrganizerMessageLogs(req.user?.email);

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Organizer message logs fetched successfully',
    organizer: result.organizer,
    emailLogs: result.logs,
  });
};

const createOrganizerMessage = async (req, res) => {
  const result = await sendOrganizerMessage({
    organizerEmail: req.user?.email,
    eventId: req.body?.eventId,
    audience: req.body?.audience,
    subject: req.body?.subject,
    body: req.body?.body,
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Organizer message sent successfully',
    log: result.log,
    recipientCount: result.recipientCount,
  });
};

const listMyInboxMessages = (req, res) => {
  const result = listInboxMessages(req.user?.email);

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Inbox messages fetched successfully',
    user: result.user,
    messages: result.messages,
  });
};

const listMySentMessages = (req, res) => {
  const result = listSentMessages(req.user?.email);

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Sent messages fetched successfully',
    user: result.user,
    emailLogs: result.logs,
  });
};

const createDirectMessage = async (req, res) => {
  const result = await sendDirectMessage({
    senderEmail: req.user?.email,
    recipientEmail: req.body?.recipientEmail,
    subject: req.body?.subject,
    body: req.body?.body,
    eventId: req.body?.eventId,
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Direct message sent successfully',
    log: result.log,
    recipient: result.recipient,
  });
};

module.exports = {
  createAdminMessage,
  createDirectMessage,
  createOrganizerMessage,
  listAdminMessages,
  listMyInboxMessages,
  listMySentMessages,
  listOrganizerMessages,
};
