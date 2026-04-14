const express = require('express');
const { getApiStatus, getHeroImage } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');
const { getNextEvent } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getApiStatus);
router.get('/events/next', getNextEvent);
router.get('/hero-image', getHeroImage);
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;
