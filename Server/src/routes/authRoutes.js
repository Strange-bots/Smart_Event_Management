const express = require('express');
const {
  authorizeDashboard,
  changePassword,
  getCurrentUserProfile,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  signup,
  updateMyProfile,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/forgot-password/request', requestPasswordResetOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);
router.post('/authorize-dashboard', authorizeDashboard);
router.post('/change-password', changePassword);
router.get('/me', getCurrentUserProfile);
router.put('/me', updateMyProfile);

module.exports = router;
