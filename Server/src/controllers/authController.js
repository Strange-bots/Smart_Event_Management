const { demoUsers } = require('../data/demoUsers');

const login = (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const matchedUser = demoUsers.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
  );

  if (!matchedUser) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({
    user: {
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
    },
  });
};

module.exports = {
  login,
};
