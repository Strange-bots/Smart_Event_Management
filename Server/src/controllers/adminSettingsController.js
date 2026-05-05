const {
  getAdminSettings,
  getPublicBrandingSettings,
  saveAdminSettings,
} = require('../services/adminSettingsService');

const getSettings = async (req, res) => {
  const adminEmail = req.user?.email || req.headers['x-user-email'];

  if (!adminEmail) {
    return res.status(401).json({
      message: 'Admin email is required',
    });
  }

  const result = await getAdminSettings(adminEmail);

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

const updateSettings = async (req, res) => {
  const adminEmail = req.user?.email || req.headers['x-user-email'];

  if (!adminEmail) {
    return res.status(401).json({
      message: 'Admin email is required',
    });
  }

  const result = await saveAdminSettings(adminEmail, req.body);

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

const getPublicSettings = async (req, res) => {
  const result = await getPublicBrandingSettings();

  return res.status(200).json({
    message: 'Public branding settings fetched successfully',
    branding: result.branding,
  });
};

module.exports = {
  getPublicSettings,
  getSettings,
  updateSettings,
};
