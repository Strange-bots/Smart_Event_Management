const adminUserSeed = {
  id: 'admin-demo',
  name: 'Demo Admin',
  firstName: 'Demo',
  lastName: 'Admin',
  email: 'admin@demo.com',
  password: 'Demo@123',
  role: 'admin',
  status: 'active',
  createdAt: '2026-02-20T08:15:00.000Z',
  updatedAt: '2026-02-20T08:15:00.000Z',
  lastLoginAt: null,
  avatar: null,
  phone: '+61 412 000 003',
  studentId: null,
  course: null,
  campus: 'Sydney',
  yearLevel: null,
  department: 'Platform Operations',
  position: 'System Administrator',
  dateOfBirth: '1990-01-23',
  address: 'KOI Head Office, Sydney NSW 2000',
  bio: 'Maintains platform operations, user access, and administrative workflows.',
  emergencyContact: {
    name: 'Alex Admin',
    relationship: 'Sibling',
    phone: '+61 412 000 097',
  },
  interests: ['Security', 'Operations', 'Analytics'],
  preferences: {
    notifications: true,
    emailDigest: true,
    preferredEventCategories: ['Operations', 'Leadership'],
  },
};

module.exports = {
  adminUserSeed,
};
