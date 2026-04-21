const express = require('express');

const { getApiStatus, getEventStats, getHeroImage } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');
const { listEvents, getNextEvent, getRecommendations } = require('../controllers/eventController');
const { listOrganizerRegistrations } = require('../controllers/registrationController');
const { listOrganizerNotifications } = require('../controllers/notificationController');
const { listOrganizerEmailLogs } = require('../controllers/emailLogController');

const router = express.Router();

router.get('/', getApiStatus);

router.get('/events/stats', getEventStats);
router.get('/events', listEvents);
router.get('/events/next', getNextEvent);
router.get('/events/recommendations', getRecommendations);
router.get('/organizer/registrations', listOrganizerRegistrations);
router.get('/organizer/notifications', listOrganizerNotifications);
router.get('/organizer/email-logs', listOrganizerEmailLogs);
router.get('/hero-image', getHeroImage);
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;
