const express = require('express');
<<<<<<< HEAD

const { getApiStatus, getHeroImage, getEventStats } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');
const { getNextEvent, getRecommendations, getAllEvents } = require('../controllers/eventController');

=======
const { getApiStatus, getEventStats, getHeroImage } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');
const { listEvents, getNextEvent, getRecommendations } = require('../controllers/eventController');
>>>>>>> 35aaa4e5ddceb36e52a3557ae950fab40598e54d

const router = express.Router();

router.get('/', getApiStatus);
<<<<<<< HEAD

router.get('/events', getAllEvents);
router.get('/events/stats', getEventStats);
router.get('/events/next', getNextEvent);
router.get('/events/recommendations', getRecommendations);
router.get('/hero-image', getHeroImage);

=======
router.get('/events/stats', getEventStats);
router.get('/events', listEvents);
router.get('/events/next', getNextEvent);
router.get('/events/recommendations', getRecommendations);
router.get('/hero-image', getHeroImage);
>>>>>>> 35aaa4e5ddceb36e52a3557ae950fab40598e54d
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;
