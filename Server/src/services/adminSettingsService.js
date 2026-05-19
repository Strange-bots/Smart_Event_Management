const { readCollection } = require('../database/collections');

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

const readSettingsFromDisk = () => mergeSettings({});

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

module.exports = {
  getPublicBrandingSettings,
  readSettingsFromDisk,
  readSettingsFromStore,
};
