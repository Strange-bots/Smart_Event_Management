const fs = require('fs');
const path = require('path');

const { findUserByEmail, sanitizeUser } = require('./authService');

const settingsFilePath = path.resolve(__dirname, '../data/adminSettings.json');

const DEFAULT_SETTINGS = {
  events: {
    requireApproval: true,
    allowWaitlist: true,
  },
  notifications: {
    newRegistration: true,
    approvalRequests: true,
    eventReminders: true,
    feedbackRequests: true,
  },
  security: {
    twoFactorAuth: false,
    emailVerification: true,
    passwordComplexity: true,
  },
  appearance: {
    darkMode: false,
  },
};

const SETTINGS_SCHEMA = {
  events: ['requireApproval', 'allowWaitlist'],
  notifications: [
    'newRegistration',
    'approvalRequests',
    'eventReminders',
    'feedbackRequests',
  ],
  security: ['twoFactorAuth', 'emailVerification', 'passwordComplexity'],
  appearance: ['darkMode'],
};

const readSettingsFromDisk = () => {
  try {
    const rawData = fs.readFileSync(settingsFilePath, 'utf8');
    const parsedSettings = JSON.parse(rawData);

    return {
      ...DEFAULT_SETTINGS,
      ...parsedSettings,
      events: { ...DEFAULT_SETTINGS.events, ...parsedSettings.events },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...parsedSettings.notifications,
      },
      security: { ...DEFAULT_SETTINGS.security, ...parsedSettings.security },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...parsedSettings.appearance },
    };
  } catch (error) {
    fs.writeFileSync(settingsFilePath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return { ...DEFAULT_SETTINGS };
  }
};

const writeSettingsToDisk = (settings) => {
  fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
};

const getAdminUser = (adminEmail) => {
  const adminUser = findUserByEmail(adminEmail);

  if (!adminUser) {
    return {
      error: 'Admin account not found',
      statusCode: 404,
    };
  }

  if (adminUser.role !== 'admin') {
    return {
      error: 'Only admins can access settings',
      statusCode: 403,
    };
  }

  return {
    admin: sanitizeUser(adminUser),
  };
};

const getAdminSettings = (adminEmail) => {
  const adminResult = getAdminUser(adminEmail);

  if (adminResult.error) {
    return adminResult;
  }

  return {
    statusCode: 200,
    admin: adminResult.admin,
    settings: readSettingsFromDisk(),
  };
};

const validateTogglePayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Settings payload must be an object';
  }

  for (const [section, fields] of Object.entries(SETTINGS_SCHEMA)) {
    if (!(section in payload)) {
      continue;
    }

    if (
      typeof payload[section] !== 'object' ||
      payload[section] === null ||
      Array.isArray(payload[section])
    ) {
      return `${section} settings must be an object`;
    }

    for (const [field, value] of Object.entries(payload[section])) {
      if (!fields.includes(field)) {
        return `Unsupported setting field: ${section}.${field}`;
      }

      if (typeof value !== 'boolean') {
        return `Setting ${section}.${field} must be true or false`;
      }
    }
  }

  return null;
};

const saveAdminSettings = (adminEmail, nextSettings) => {
  const adminResult = getAdminUser(adminEmail);

  if (adminResult.error) {
    return adminResult;
  }

  const validationError = validateTogglePayload(nextSettings);

  if (validationError) {
    return {
      error: validationError,
      statusCode: 400,
    };
  }

  const currentSettings = readSettingsFromDisk();
  const mergedSettings = {
    ...currentSettings,
    ...nextSettings,
    events: { ...currentSettings.events, ...nextSettings.events },
    notifications: {
      ...currentSettings.notifications,
      ...nextSettings.notifications,
    },
    security: { ...currentSettings.security, ...nextSettings.security },
    appearance: { ...currentSettings.appearance, ...nextSettings.appearance },
  };

  writeSettingsToDisk(mergedSettings);

  return {
    statusCode: 200,
    admin: adminResult.admin,
    settings: mergedSettings,
  };
};

module.exports = {
  readSettingsFromDisk,
  getAdminSettings,
  saveAdminSettings,
};
