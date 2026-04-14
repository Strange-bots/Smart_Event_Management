const express = require('express');
const { getApiStatus, getHeroImage } = require('../controllers/indexController');
const { login, signup, verifyOTP } = require('../controllers/authController');

const router = express.Router();

router.get('/', getApiStatus);
router.get('/hero-image', getHeroImage);
router.post('/login', login);
router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);

module.exports = router;
