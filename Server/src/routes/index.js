const express = require('express');

const { getApiStatus, getEventStats, getHeroImage } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');
const {
  createOrganizerEventRecord,
  deleteOrganizerEventRecord,
  duplicateOrganizerEventRecord,
  listEvents,
  getNextEvent,
  getRecommendations,
  listOrganizerEvents,
  updateOrganizerEventRecord,
  uploadEventImage,
} = require('../controllers/eventController');
const {
  createEventRegistration,
  createUserRegistration,
  deleteUserRegistration,
  downloadOrganizerRegistrations,
  listCurrentUserEventRegistrations,
  listUserRegistrations,
  listOrganizerRegistrations,
  updateUserRegistration,
} = require('../controllers/registrationController');
const {
  createFeedback,
  listOrganizerFeedback,
} = require('../controllers/feedbackController');
const { listOrganizerNotifications } = require('../controllers/notificationController');
const { listOrganizerEmailLogs } = require('../controllers/emailLogController');
const { subscribeToNewsletter } = require('../controllers/newsletterController');
const { getAdminOverviewStats } = require('../controllers/adminDashboardController');
const {
  createUserHistoryReportRecord,
  listUserHistoryRecords,
} = require('../controllers/userHistoryController');
const { requireRole } = require('../middleware/requireRole');
const upload = require('../middleware/upload');
const authRoutes = require('./authRoutes');
const { getSettings, updateSettings } = require('../controllers/adminSettingsController');

const router = express.Router();

router.get('/', getApiStatus);

router.post('/upload', upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const filenames = req.files.map((f) => f.filename);
  res.json({ message: 'Images uploaded successfully', files: filenames });
});

router.get('/events/stats', getEventStats);
router.get('/events', listEvents);
router.get('/events/next', getNextEvent);
router.get('/events/recommendations', getRecommendations);
router.post('/events/:eventId/registrations', requireRole('user'), createEventRegistration);
router.get('/users/events', requireRole('user'), listCurrentUserEventRegistrations);
router.get('/organizer/events', requireRole('organizer'), listOrganizerEvents);
router.post('/organizer/events', requireRole('organizer'), createOrganizerEventRecord);
router.put('/organizer/events/:eventId', requireRole('organizer'), updateOrganizerEventRecord);
router.post('/organizer/events/:eventId/duplicate', requireRole('organizer'), duplicateOrganizerEventRecord);
router.delete('/organizer/events/:eventId', requireRole('organizer'), deleteOrganizerEventRecord);
router.post('/admin/events/:eventId/image', requireRole('admin'), uploadEventImage);
router.get('/admin/dashboard/overview', requireRole('admin'), getAdminOverviewStats);
router.get('/organizer/registrations/export', requireRole('organizer'), downloadOrganizerRegistrations);
router.get('/registrations/users', requireRole('admin'), listUserRegistrations);
router.post('/registrations/users', createUserRegistration);
router.put('/registrations/users/:email', requireRole('admin'), updateUserRegistration);
router.delete('/registrations/users/:email', requireRole('admin'), deleteUserRegistration);
router.get('/admin/settings', requireRole('admin'), getSettings);
router.put('/admin/settings', requireRole('admin'), updateSettings);
router.get('/organizer/feedback', requireRole('organizer'), listOrganizerFeedback);
router.post('/feedback', requireRole('user'), createFeedback);
router.get('/organizer/registrations', requireRole('organizer'), listOrganizerRegistrations);
router.get('/user-history', requireRole(['admin', 'organizer']), listUserHistoryRecords);
router.post('/user-history/reports', requireRole(['admin', 'organizer']), createUserHistoryReportRecord);
router.get('/organizer/notifications', requireRole('organizer'), listOrganizerNotifications);
router.get('/organizer/email-logs', requireRole('organizer'), listOrganizerEmailLogs);
router.get('/hero-image', getHeroImage);
router.post('/newsletter/subscribe', subscribeToNewsletter);
router.use('/auth', authRoutes);
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;
