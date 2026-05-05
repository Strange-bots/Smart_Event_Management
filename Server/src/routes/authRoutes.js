const express = require('express');
const {
  authorizeDashboard,
  changePassword,
  getCurrentUserProfile,
  registerUser,
  updateMyProfile,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', registerUser);
router.post('/authorize-dashboard', authorizeDashboard);
router.post('/change-password', changePassword);
router.get('/me', getCurrentUserProfile);
router.put('/me', updateMyProfile);

module.exports = router;
