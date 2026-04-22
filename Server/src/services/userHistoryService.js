const { demoUsers } = require('../data/demoUsers');
const { registrations } = require('../data/registrations');
const { registeredUsers } = require('../data/registeredUsers');
const { userHistoryReports } = require('../data/userHistory');
const { findUserByEmail, sanitizeUser } = require('./authService');

const VALID_RISK_LEVELS = new Set(['low', 'medium', 'high']);
const VALID_EVENT_PHASES = new Set(['before', 'during', 'after']);

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const getAllUsers = () =>
  [...demoUsers, ...registeredUsers].filter((user) => user.role === 'user');

const buildFallbackUser = ({ name, email }) => ({
  name,
  email,
  role: 'user',
});

const findReportableUser = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = findUserByEmail(normalizedEmail);

  if (existingUser?.role === 'user') {
    return existingUser;
  }

  const registration = registrations.find(
    (item) => normalizeEmail(item.userEmail) === normalizedEmail,
  );

  if (!registration) {
    return null;
  }

  return buildFallbackUser({
    name: registration.userName,
    email: registration.userEmail,
  });
};

const getUserReports = (userEmail) =>
  userHistoryReports
    .filter((report) => normalizeEmail(report.userEmail) === normalizeEmail(userEmail))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

const calculateRiskLevel = (reports) => {
  if (reports.some((report) => report.riskLevel === 'high')) {
    return 'high';
  }

  const mediumReports = reports.filter((report) => report.riskLevel === 'medium');

  if (mediumReports.length >= 1) {
    return 'medium';
  }

  return 'low';
};

const buildUserHistoryRecord = (user) => {
  const reports = getUserReports(user.email);

  return {
    ...sanitizeUser(user),
    riskLevel: calculateRiskLevel(reports),
    reportCount: reports.length,
    reports,
  };
};

const listUserHistory = ({ riskLevel } = {}) => {
  const normalizedRiskLevel = String(riskLevel || '').trim().toLowerCase();
  const usersByEmail = new Map(
    getAllUsers().map((user) => [normalizeEmail(user.email), user]),
  );

  registrations.forEach((registration) => {
    const email = normalizeEmail(registration.userEmail);

    if (!usersByEmail.has(email)) {
      usersByEmail.set(
        email,
        buildFallbackUser({
          name: registration.userName,
          email: registration.userEmail,
        }),
      );
    }
  });

  const users = Array.from(usersByEmail.values())
    .map(buildUserHistoryRecord)
    .filter(
      (user) =>
        !normalizedRiskLevel ||
        normalizedRiskLevel === 'all' ||
        user.riskLevel === normalizedRiskLevel,
    );

  return {
    statusCode: 200,
    users,
  };
};

const createUserHistoryReport = ({ reporter, payload = {} }) => {
  const userEmail = normalizeEmail(payload.userEmail);
  const user = findReportableUser(userEmail);

  if (!user) {
    return {
      error: 'User is not registered for this platform or any event',
      statusCode: 404,
    };
  }

  const riskLevel = String(payload.riskLevel || '').trim().toLowerCase();

  if (!VALID_RISK_LEVELS.has(riskLevel) || riskLevel === 'low') {
    return {
      error: 'Report risk level must be medium or high',
      statusCode: 400,
    };
  }

  const eventPhase = String(payload.eventPhase || '').trim().toLowerCase();

  if (!VALID_EVENT_PHASES.has(eventPhase)) {
    return {
      error: 'Event phase must be before, during, or after',
      statusCode: 400,
    };
  }

  const reason = String(payload.reason || '').trim();

  if (!reason) {
    return {
      error: 'Report reason is required',
      statusCode: 400,
    };
  }

  const report = {
    id: `history-${Date.now()}`,
    userName: user.name,
    userEmail: user.email,
    riskLevel,
    eventPhase,
    eventId: payload.eventId ?? null,
    eventTitle: String(payload.eventTitle || '').trim(),
    reason,
    reportedByName: reporter.name,
    reportedByEmail: reporter.email,
    reporterRole: reporter.role,
    createdAt: new Date().toISOString(),
  };

  userHistoryReports.unshift(report);

  return {
    statusCode: 201,
    report,
    user: buildUserHistoryRecord(user),
  };
};

const getUserRiskLevel = (userEmail) =>
  calculateRiskLevel(getUserReports(userEmail));

module.exports = {
  createUserHistoryReport,
  getUserRiskLevel,
  listUserHistory,
};
