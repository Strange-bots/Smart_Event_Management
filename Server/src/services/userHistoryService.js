const { readCollection, writeCollection } = require('../database/collections');
const { findUserByEmail, sanitizeUser } = require('./authService');

const VALID_RISK_LEVELS = new Set(['low', 'medium', 'high']);
const VALID_EVENT_PHASES = new Set(['before', 'during', 'after']);

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const buildFallbackUser = ({ name, email }) => ({
  name,
  email,
  role: 'user',
});

const getAllUsers = async () => {
  const users = await readCollection('users');
  return users.filter((user) => user.role === 'user');
};

const findReportableUser = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser?.role === 'user') {
    return existingUser;
  }

  const registrations = await readCollection('registrations');
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

const getUserReports = async (userEmail) => {
  const reports = await readCollection('userHistoryReports');
  return reports
    .filter((report) => normalizeEmail(report.userEmail) === normalizeEmail(userEmail))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

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

const buildUserHistoryRecord = async (user) => {
  const reports = await getUserReports(user.email);

  return {
    ...sanitizeUser(user),
    riskLevel: calculateRiskLevel(reports),
    reportCount: reports.length,
    reports,
  };
};

const listUserHistory = async ({ riskLevel } = {}) => {
  const normalizedRiskLevel = String(riskLevel || '').trim().toLowerCase();
  const usersByEmail = new Map();
  const [users, registrations] = await Promise.all([
    getAllUsers(),
    readCollection('registrations'),
  ]);

  users.forEach((user) => {
    usersByEmail.set(normalizeEmail(user.email), user);
  });

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

  const historyRecords = await Promise.all(
    Array.from(usersByEmail.values()).map(buildUserHistoryRecord),
  );

  return {
    statusCode: 200,
    users: historyRecords.filter(
      (user) =>
        !normalizedRiskLevel ||
        normalizedRiskLevel === 'all' ||
        user.riskLevel === normalizedRiskLevel,
    ),
  };
};

const createUserHistoryReport = async ({ reporter, payload = {} }) => {
  const userEmail = normalizeEmail(payload.userEmail);
  const user = await findReportableUser(userEmail);

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

  const reports = await readCollection('userHistoryReports');
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

  reports.unshift(report);
  await writeCollection('userHistoryReports', reports);

  return {
    statusCode: 201,
    report,
    user: await buildUserHistoryRecord(user),
  };
};

const getUserRiskLevel = async (userEmail) =>
  calculateRiskLevel(await getUserReports(userEmail));

module.exports = {
  createUserHistoryReport,
  getUserRiskLevel,
  listUserHistory,
};
