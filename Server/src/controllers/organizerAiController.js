const {
  generateEventDescription,
  generateEventImages,
  suggestEventTags,
  suggestEventTimes,
} = require('../services/organizerAiService');

const generateOrganizerEventDescription = async (req, res) => {
  const result = await generateEventDescription({
    organizerEmail: req.user.email,
    payload: req.body ?? {},
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Event description generated successfully',
    description: result.description,
    source: result.source,
    reason: result.reason || null,
    modelResult: result.modelResult || null,
  });
};

const suggestOrganizerEventTags = async (req, res) => {
  const result = await suggestEventTags({
    organizerEmail: req.user.email,
    payload: req.body ?? {},
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Event tags suggested successfully',
    tags: result.tags,
    source: result.source,
    reason: result.reason || null,
    modelResult: result.modelResult || null,
  });
};

const suggestOrganizerEventTimes = async (req, res) => {
  const result = await suggestEventTimes({
    organizerEmail: req.user.email,
    payload: req.body ?? {},
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Event time suggestions generated successfully',
    suggestions: result.suggestions,
    source: result.source,
    reason: result.reason || null,
    modelResult: result.modelResult || null,
  });
};

const generateOrganizerEventImages = async (req, res) => {
  const result = await generateEventImages({
    organizerEmail: req.user.email,
    payload: req.body ?? {},
  });

  if (result.error) {
    return res.status(result.statusCode).json({ message: result.error });
  }

  return res.status(result.statusCode).json({
    message: 'Event images generated successfully',
    images: result.images,
    source: result.source,
    reason: result.reason || null,
    modelResult: result.modelResult || null,
  });
};

module.exports = {
  generateOrganizerEventDescription,
  generateOrganizerEventImages,
  suggestOrganizerEventTags,
  suggestOrganizerEventTimes,
};
