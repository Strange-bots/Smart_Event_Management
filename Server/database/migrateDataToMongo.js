require('dotenv').config();

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const { connectDatabase } = require('../src/config/database');
const { adminUserSeed } = require('./seeds/adminUserSeed');

const PASSWORD_SALT_ROUNDS = 10;

const isBcryptHash = (value = '') =>
  typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const run = async () => {
  await connectDatabase();

  const users = mongoose.connection.db.collection('users');
  await users.createIndex({ sourceId: 1 }, { unique: true });
  await users.createIndex({ email: 1 }, { unique: true });

  const adminDocument = {
    sourceId: String(adminUserSeed.id),
    name: adminUserSeed.name,
    firstName: adminUserSeed.firstName || null,
    lastName: adminUserSeed.lastName || null,
    email: String(adminUserSeed.email).toLowerCase(),
    password: isBcryptHash(adminUserSeed.password)
      ? adminUserSeed.password
      : await bcrypt.hash(adminUserSeed.password, PASSWORD_SALT_ROUNDS),
    role: adminUserSeed.role || 'admin',
    status: adminUserSeed.status || 'active',
    avatar: adminUserSeed.avatar || null,
    phone: adminUserSeed.phone || null,
    studentId: adminUserSeed.studentId || null,
    course: adminUserSeed.course || null,
    campus: adminUserSeed.campus || null,
    yearLevel: adminUserSeed.yearLevel || null,
    department: adminUserSeed.department || null,
    position: adminUserSeed.position || null,
    dateOfBirth: adminUserSeed.dateOfBirth || null,
    address: adminUserSeed.address || null,
    bio: adminUserSeed.bio || null,
    emergencyContact: adminUserSeed.emergencyContact || null,
    interests: Array.isArray(adminUserSeed.interests) ? adminUserSeed.interests : [],
    preferences: adminUserSeed.preferences || {},
    createdAt: parseDate(adminUserSeed.createdAt),
    updatedAt: parseDate(adminUserSeed.updatedAt || adminUserSeed.createdAt),
    lastLoginAt: parseDate(adminUserSeed.lastLoginAt),
  };

  await users.updateOne(
    {
      $or: [
        { sourceId: adminDocument.sourceId },
        { email: adminDocument.email },
      ],
    },
    { $set: adminDocument },
    { upsert: true },
  );

  console.log('Admin login seed ensured successfully');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Failed to ensure admin login seed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
