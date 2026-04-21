const { demoUsers } = require('../data/demoUsers');
const { registeredUsers } = require('../data/registeredUsers');
const { events } = require('../data/events');
const { registrations } = require('../data/registrations');
const { findUserByEmail, sanitizeUser } = require('./authService');

const getUniqueUsers = () => {
  const seenEmails = new Set();

  return [...demoUsers, ...registeredUsers].filter((user) => {
    const normalizedEmail = user.email.toLowerCase();

    if (seenEmails.has(normalizedEmail)) {
      return false;
    }

    seenEmails.add(normalizedEmail);
    return true;
  });
};

const getAdminDashboardOverview = (adminEmail) => {
  const adminUser = findUserByEmail(adminEmail);

  if (!adminUser) {
    return {
      error: 'Admin account not found',
      statusCode: 404,
    };
  }

  if (adminUser.role !== 'admin') {
    return {
      error: 'Only admins can access dashboard overview stats',
      statusCode: 403,
    };
  }

  const totalUsers = getUniqueUsers().length;
  const totalEvents = events.length;
  const paidRegistrationCount = registrations.filter(
    (registration) => registration.paymentStatus === 'paid',
  ).length;

  return {
    statusCode: 200,
    admin: sanitizeUser(adminUser),
    stats: {
      totalUsers,
      totalEvents,
      totalRevenue: 0,
      currency: 'AUD',
      revenueLogic:
        'Revenue amounts are not stored in the backend yet. Registrations currently track payment status only, so totalRevenue is returned as 0.',
      paidRegistrationCount,
    },
  };
};

module.exports = {
  getAdminDashboardOverview,
};
