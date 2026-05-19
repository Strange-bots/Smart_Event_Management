const { getPublicBrandingSettings } = require('../services/adminSettingsService');

const getPublicSettings = async (req, res) => {
  const result = await getPublicBrandingSettings();

  return res.status(200).json({
    message: 'Public branding settings fetched successfully',
    branding: result.branding,
  });
};

module.exports = {
  getPublicSettings,
};
