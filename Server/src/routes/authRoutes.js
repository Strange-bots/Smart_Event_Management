const express = require('express');
const {
  authorizeDashboard,
  changePassword,
  registerUser,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', registerUser);
router.post('/authorize-dashboard', authorizeDashboard);
router.post('/change-password', changePassword);

module.exports = router;
