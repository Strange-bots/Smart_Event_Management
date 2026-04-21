const {
  sanitizeUser,
  verifySessionToken,
} = require('../services/authService');

const getBearerToken = (req) =>
  req.headers.authorization?.replace(/^Bearer\s+/i, '');

const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const user = verifySessionToken(getBearerToken(req));

    if (!user) {
      return res.status(401).json({ message: 'Authentication is required' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        message: 'You are not authorized to access this resource',
        requiredRoles: roles,
        user: sanitizeUser(user),
      });
    }

    req.user = sanitizeUser(user);
    return next();
  };
};

module.exports = {
  requireRole,
};
