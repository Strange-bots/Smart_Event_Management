const express = require('express');

const { getApiStatus, getEventStats, getHeroImage } = require('../controllers/indexController');
const { authorizeDashboard, login, signup } = require('../controllers/authController');
const { listEvents, getNextEvent, getRecommendations, uploadEventImage } = require('../controllers/eventController');
const { listOrganizerRegistrations } = require('../controllers/registrationController');
const { listOrganizerNotifications } = require('../controllers/notificationController');
const { listOrganizerEmailLogs } = require('../controllers/emailLogController');
const { subscribeToNewsletter } = require('../controllers/newsletterController');
const { getAdminOverviewStats } = require('../controllers/adminDashboardController');
const { requireRole } = require('../middleware/requireRole');
const contactRoutes = require('./contactRoutes');

const router = express.Router();

router.get('/', getApiStatus);

router.get('/events/stats', getEventStats);
router.get('/events', listEvents);
router.get('/events/next', getNextEvent);
router.get('/events/recommendations', getRecommendations);
router.post('/admin/events/:eventId/image', requireRole('admin'), uploadEventImage);
router.get('/admin/dashboard/overview', requireRole('admin'), getAdminOverviewStats);
router.get('/organizer/registrations', requireRole('organizer'), listOrganizerRegistrations);
router.get('/organizer/notifications', requireRole('organizer'), listOrganizerNotifications);
router.get('/organizer/email-logs', requireRole('organizer'), listOrganizerEmailLogs);
router.get('/hero-image', getHeroImage);
router.post('/newsletter/subscribe', subscribeToNewsletter);
router.post('/auth/authorize-dashboard', authorizeDashboard);
router.post('/login', login);
router.post('/signup', signup);
router.use('/contact', contactRoutes);

module.exports = router;
