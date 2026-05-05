const { readCollection, writeCollection } = require('../database/collections');
const { findUserByEmail, sanitizeUser } = require('./authService');

const DEFAULT_SETTINGS = {
  organization: {
    name: "King's Own Institute",
    email: 'events@koi.edu.au',
    phone: '+61 2 9283 3583',
    address: 'Level 1, 545 Kent Street, Sydney NSW 2000',
    logo: null,
  },
  events: {
    defaultCapacity: 100,
    registrationDeadline: 3,
    requireApproval: true,
    allowWaitlist: true,
  },
  notifications: {
    newRegistration: true,
    approvalRequests: true,
    eventReminders: true,
    feedbackRequests: true,
  },
  email: {
    smtpHost: 'smtp.koi.edu.au',
    smtpPort: '587',
    smtpUser: 'events@koi.edu.au',
    smtpPass: '********',
  },
  security: {
    twoFactorAuth: false,
    emailVerification: true,
    passwordComplexity: true,
    sessionTimeout: 30,
    maxSessions: 3,
  },
  appearance: {
    themeMode: 'light',
    darkMode: false,
    primaryColor: '#1F4E79',
    accentColor: '#F36F21',
  },
};

const SETTINGS_SCHEMA = {
  organization: ['name', 'email', 'phone', 'address', 'logo'],
  events: [
    'defaultCapacity',
    'registrationDeadline',
    'requireApproval',
    'allowWaitlist',
  ],
  notifications: [
    'newRegistration',
    'approvalRequests',
    'eventReminders',
    'feedbackRequests',
  ],
  email: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass'],
  security: [
    'twoFactorAuth',
    'emailVerification',
    'passwordComplexity',
    'sessionTimeout',
    'maxSessions',
  ],
  appearance: ['themeMode', 'darkMode', 'primaryColor', 'accentColor'],
};

const NUMERIC_SETTING_FIELDS = {
  events: ['defaultCapacity', 'registrationDeadline'],
  security: ['sessionTimeout', 'maxSessions'],
};

const COLOR_SETTING_FIELDS = {
  appearance: ['primaryColor', 'accentColor'],
};

const STRING_SETTING_FIELDS = {
  organization: ['name', 'email', 'phone', 'address', 'logo'],
  email: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass'],
};

const EMAIL_SETTING_FIELDS = {
  organization: ['email'],
};

const THEME_MODE_VALUES = new Set(['light', 'dark', 'system']);
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mergeSettings = (parsedSettings = {}) => ({
  ...DEFAULT_SETTINGS,
  ...parsedSettings,
  organization: { ...DEFAULT_SETTINGS.organization, ...parsedSettings.organization },
  events: { ...DEFAULT_SETTINGS.events, ...parsedSettings.events },
  notifications: {
    ...DEFAULT_SETTINGS.notifications,
    ...parsedSettings.notifications,
  },
  email: { ...DEFAULT_SETTINGS.email, ...parsedSettings.email },
  security: { ...DEFAULT_SETTINGS.security, ...parsedSettings.security },
  appearance: { ...DEFAULT_SETTINGS.appearance, ...parsedSettings.appearance },
});

const readSettingsFromStore = async () =>
  mergeSettings((await readCollection('adminSettings')) || {});

const getAdminUser = async (adminEmail) => {
  const adminUser = await findUserByEmail(adminEmail);

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

const getAdminSettings = async (adminEmail) => {
  const adminResult = await getAdminUser(adminEmail);

  if (adminResult.error) {
    return adminResult;
  }

  return {
    statusCode: 200,
    admin: adminResult.admin,
    settings: await readSettingsFromStore(),
  };
};

const getPublicBrandingSettings = async () => {
  const settings = await readSettingsFromStore();

  return {
    statusCode: 200,
    branding: {
      organization: settings.organization,
      appearance: settings.appearance,
    },
  };
};

const validateSettingsPayload = (payload) => {
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

      if (NUMERIC_SETTING_FIELDS[section]?.includes(field)) {
        if (!Number.isInteger(value) || value <= 0) {
          return `Setting ${section}.${field} must be a positive whole number`;
        }

        continue;
      }

      if (COLOR_SETTING_FIELDS[section]?.includes(field)) {
        if (typeof value !== 'string' || !HEX_COLOR_REGEX.test(value)) {
          return `Setting ${section}.${field} must be a valid hex color`;
        }

        continue;
      }

      if (section === 'appearance' && field === 'themeMode') {
        if (typeof value !== 'string' || !THEME_MODE_VALUES.has(value)) {
          return 'Setting appearance.themeMode must be light, dark, or system';
        }

        continue;
      }

      if (STRING_SETTING_FIELDS[section]?.includes(field)) {
        if (typeof value !== 'string') {
          return `Setting ${section}.${field} must be text`;
        }

        if (field !== 'logo' && !value.trim()) {
          return `Setting ${section}.${field} cannot be empty`;
        }

        if (
          EMAIL_SETTING_FIELDS[section]?.includes(field) &&
          !EMAIL_REGEX.test(value.trim())
        ) {
          return `Setting ${section}.${field} must be a valid email address`;
        }

        continue;
      }

      if (typeof value !== 'boolean') {
        return `Setting ${section}.${field} must be true or false`;
      }
    }
  }

  return null;
};

const saveAdminSettings = async (adminEmail, nextSettings) => {
  const adminResult = await getAdminUser(adminEmail);

  if (adminResult.error) {
    return adminResult;
  }

  const validationError = validateSettingsPayload(nextSettings);

  if (validationError) {
    return {
      error: validationError,
      statusCode: 400,
    };
  }

  const currentSettings = await readSettingsFromStore();
  const mergedSettings = mergeSettings({
    ...currentSettings,
    ...nextSettings,
    organization: { ...currentSettings.organization, ...nextSettings.organization },
    events: { ...currentSettings.events, ...nextSettings.events },
    notifications: {
      ...currentSettings.notifications,
      ...nextSettings.notifications,
    },
    email: { ...currentSettings.email, ...nextSettings.email },
    security: { ...currentSettings.security, ...nextSettings.security },
    appearance: { ...currentSettings.appearance, ...nextSettings.appearance },
  });

  await writeCollection('adminSettings', mergedSettings);

  return {
    statusCode: 200,
    admin: adminResult.admin,
    settings: mergedSettings,
  };
};

module.exports = {
  getAdminSettings,
  getPublicBrandingSettings,
  readSettingsFromStore,
  saveAdminSettings,
};
