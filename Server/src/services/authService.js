const { demoUsers } = require('../data/demoUsers');
const { registeredUsers } = require('../data/registeredUsers');

const normalizeEmail = (email) => email.trim().toLowerCase();

const sanitizeUser = (user) => ({
  name: user.name,
  email: user.email,
  role: user.role,
});

const findUserByEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);

  return [...demoUsers, ...registeredUsers].find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );
};

const findUserByCredentials = (email, password) => {
  const normalizedEmail = normalizeEmail(email);

  return [...demoUsers, ...registeredUsers].find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
  );
};

const createUser = ({ name, email, password }) => {
  const newUser = {
    name: name.trim(),
    email: normalizeEmail(email),
    password,
    role: 'user',
  };

  registeredUsers.push(newUser);

  return sanitizeUser(newUser);
};

module.exports = {
  createUser,
  findUserByCredentials,
  findUserByEmail,
  sanitizeUser,
};
