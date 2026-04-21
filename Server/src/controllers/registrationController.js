const {
  exportOrganizerRegistrations,
  getOrganizerRegistrationDetails,
} = require('../services/registrationService');

const listOrganizerRegistrations = (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = getOrganizerRegistrationDetails(organizerEmail);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Organizer registrations fetched successfully',
    organizer: result.organizer,
    registrations: result.registrations,
  });
};

const downloadOrganizerRegistrations = (req, res) => {
  const organizerEmail = req.user?.email || req.headers['x-user-email'];

  if (!organizerEmail) {
    return res.status(401).json({
      message: 'Organizer email is required',
    });
  }

  const result = exportOrganizerRegistrations(organizerEmail, req.query ?? {});

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${result.fileName}"`,
  );

  return res.status(200).send(result.workbook);
};

module.exports = {
  downloadOrganizerRegistrations,
  listOrganizerRegistrations,
};
