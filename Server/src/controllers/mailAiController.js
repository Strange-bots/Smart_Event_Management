const {
  generateAdminMailTemplates,
  generateOrganizerMailTemplates,
} = require('../services/mailAiService');

const getOrganizerMailTemplates = async (req, res) => {
  const result = await generateOrganizerMailTemplates({
    organizerEmail: req.user?.email,
    eventId: req.body?.eventId,
    tone: req.body?.tone,
    audience: req.body?.audience,
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Organizer mail templates generated successfully',
    templates: result.templates,
    source: result.source,
    reason: result.reason || null,
    modelResult: result.modelResult || null,
  });
};

const getAdminMailTemplates = async (req, res) => {
  const result = await generateAdminMailTemplates({
    adminEmail: req.user?.email,
    tone: req.body?.tone,
    recipientGroup: req.body?.recipientGroup,
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(200).json({
    message: 'Admin mail templates generated successfully',
    templates: result.templates,
    source: result.source,
    reason: result.reason || null,
    modelResult: result.modelResult || null,
  });
};

module.exports = {
  getAdminMailTemplates,
  getOrganizerMailTemplates,
};
