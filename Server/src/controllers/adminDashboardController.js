const { getAdminDashboardOverview } = require('../services/adminDashboardService');

const getAdminOverviewStats = (req, res) => {
  const adminEmail = req.headers['x-user-email'];

  if (!adminEmail) {
    return res.status(401).json({
      message: 'Admin email is required',
    });
  }

  const result = getAdminDashboardOverview(adminEmail);

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(200).json({
    message: 'Admin dashboard overview fetched successfully',
    admin: result.admin,
    stats: result.stats,
  });
};

module.exports = {
  getAdminOverviewStats,
};
