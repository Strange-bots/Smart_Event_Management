const { getEmailLogsForUser } = require('../services/emailLogService');

const listOrganizerEmailLogs = async (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = await getEmailLogsForUser(organizerEmail, 'organizer');

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Organizer email logs fetched successfully',
    organizer: result.user,
    emailLogs: result.emailLogs,
  });
};

module.exports = {
  listOrganizerEmailLogs,
};
