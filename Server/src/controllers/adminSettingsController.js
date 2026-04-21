const {
  getAdminSettings,
  saveAdminSettings,
} = require('../services/adminSettingsService');

const getSettings = (req, res) => {
  const adminEmail = req.headers['x-user-email'];

  if (!adminEmail) {
    return res.status(401).json({
      message: 'Admin email is required',
    });
  }

  const result = getAdminSettings(adminEmail);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Admin settings fetched successfully',
    admin: result.admin,
    settings: result.settings,
  });
};

const updateSettings = (req, res) => {
  const adminEmail = req.headers['x-user-email'];

  if (!adminEmail) {
    return res.status(401).json({
      message: 'Admin email is required',
    });
  }

  const result = saveAdminSettings(adminEmail, req.body);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Admin settings saved successfully',
    admin: result.admin,
    settings: result.settings,
  });
};

module.exports = {
  getSettings,
  updateSettings,
};
