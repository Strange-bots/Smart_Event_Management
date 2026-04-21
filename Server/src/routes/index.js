const express = require('express');
const { getApiStatus, getEventStats, getHeroImage } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');
const { listEvents, getNextEvent, getRecommendations } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getApiStatus);
router.get('/events/stats', getEventStats);
router.get('/events', listEvents);
router.get('/events/next', getNextEvent);
router.get('/events/recommendations', getRecommendations);
router.get('/hero-image', getHeroImage);
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;
