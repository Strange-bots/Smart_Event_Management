const express = require('express');
<<<<<<< HEAD
const { getApiStatus, getEventStats } = require('../controllers/indexController');
const { login } = require('../controllers/authController');
=======
const { getApiStatus, getHeroImage } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');
const { getNextEvent, getRecommendations } = require('../controllers/eventController');
>>>>>>> 335cb0278dcc007e526d9fed62bb2b09519d5c5a

const router = express.Router();

router.get('/', getApiStatus);
<<<<<<< HEAD
router.get('/events/stats', getEventStats);
=======
router.get('/events/next', getNextEvent);
router.get('/events/recommendations', getRecommendations);
router.get('/hero-image', getHeroImage);
>>>>>>> 335cb0278dcc007e526d9fed62bb2b09519d5c5a
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;
