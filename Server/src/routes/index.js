const express = require('express');

const { getApiStatus, getEventStats, getHeroImage } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');
const {
  approveAdminEventRecord,
  createOrganizerEventRecord,
  deleteAdminEventRecord,
  deleteAdminEventImageRecord,
  deleteOrganizerEventRecord,
  duplicateOrganizerEventRecord,
  getFeaturedEventsList,
  listAdminEvents,
  listAdminGalleryImages,
  listEvents,
  getNextEvent,
  getRecommendations,
  listOrganizerEvents,
  rejectAdminEventRecord,
  updateOrganizerEventRecord,
  uploadEventImage,
} = require('../controllers/eventController');
const {
  createEventRegistration,
  createAdminManagedUser,
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
  listMyFeedback,
  listOrganizerFeedback,
} = require('../controllers/feedbackController');
const {
  listMyNotifications,
  listOrganizerNotifications,
  markAllMyNotificationsRead,
  markAllOrganizerNotificationsRead,
  updateMyNotificationReadStatus,
  updateOrganizerNotificationReadStatus,
} = require('../controllers/notificationController');
const { listOrganizerEmailLogs } = require('../controllers/emailLogController');
const { subscribeToNewsletter } = require('../controllers/newsletterController');
const {
  createAdminMessage,
  createDirectMessage,
  createOrganizerMessage,
  listAdminMessages,
  listMyInboxMessages,
  listMySentMessages,
  listOrganizerMessages,
} = require('../controllers/messagingController');
const { getAdminOverviewStats } = require('../controllers/adminDashboardController');
const {
  createUserHistoryReportRecord,
  listUserHistoryRecords,
} = require('../controllers/userHistoryController');
const { requireRole } = require('../middleware/requireRole');
const upload = require('../middleware/upload');
const authRoutes = require('./authRoutes');
const {
  getPublicSettings,
  getSettings,
  updateSettings,
} = require('../controllers/adminSettingsController');

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
router.get('/events/featured', getFeaturedEventsList);
router.get('/events/recommendations', getRecommendations);
router.get('/admin/events', requireRole('admin'), listAdminEvents);
router.get('/admin/gallery', requireRole('admin'), listAdminGalleryImages);
router.patch('/admin/events/:eventId/approve', requireRole('admin'), approveAdminEventRecord);
router.patch('/admin/events/:eventId/reject', requireRole('admin'), rejectAdminEventRecord);
router.delete('/admin/events/:eventId', requireRole('admin'), deleteAdminEventRecord);
router.delete('/admin/events/:eventId/image', requireRole('admin'), deleteAdminEventImageRecord);
router.post('/events/:eventId/registrations', requireRole('user'), createEventRegistration);
router.get('/users/events', requireRole('user'), listCurrentUserEventRegistrations);
router.get('/organizer/events', requireRole('organizer'), listOrganizerEvents);
router.post('/organizer/events', requireRole('organizer'), createOrganizerEventRecord);
router.put('/organizer/events/:eventId', requireRole('organizer'), updateOrganizerEventRecord);
router.post('/organizer/events/:eventId/duplicate', requireRole('organizer'), duplicateOrganizerEventRecord);
router.delete('/organizer/events/:eventId', requireRole('organizer'), deleteOrganizerEventRecord);
router.post('/admin/events/:eventId/image', requireRole('admin'), uploadEventImage);
router.get('/admin/dashboard/overview', requireRole('admin'), getAdminOverviewStats);
router.get('/admin/messages', requireRole('admin'), listAdminMessages);
router.post('/admin/messages', requireRole('admin'), createAdminMessage);
router.get('/organizer/registrations/export', requireRole('organizer'), downloadOrganizerRegistrations);
router.get('/registrations/users', requireRole('admin'), listUserRegistrations);
router.post('/registrations/users', createUserRegistration);
router.put('/registrations/users/:email', requireRole('admin'), updateUserRegistration);
router.delete('/registrations/users/:email', requireRole('admin'), deleteUserRegistration);
router.get('/admin/settings', requireRole('admin'), getSettings);
router.put('/admin/settings', requireRole('admin'), updateSettings);
router.get('/settings/public', getPublicSettings);
router.post('/admin/users', requireRole('admin'), createAdminManagedUser);
router.get('/organizer/feedback', requireRole('organizer'), listOrganizerFeedback);
router.get('/organizer/messages', requireRole('organizer'), listOrganizerMessages);
router.post('/organizer/messages', requireRole('organizer'), createOrganizerMessage);
router.get('/feedback/my', requireRole('user'), listMyFeedback);
router.post('/feedback', requireRole('user'), createFeedback);
router.get('/organizer/registrations', requireRole('organizer'), listOrganizerRegistrations);
router.get('/user-history', requireRole(['admin', 'organizer']), listUserHistoryRecords);
router.post('/user-history/reports', requireRole(['admin', 'organizer']), createUserHistoryReportRecord);
router.get('/organizer/notifications', requireRole('organizer'), listOrganizerNotifications);
router.patch('/organizer/notifications/read-all', requireRole('organizer'), markAllOrganizerNotificationsRead);
router.patch('/organizer/notifications/:notificationId/read', requireRole('organizer'), updateOrganizerNotificationReadStatus);
router.get('/notifications', requireRole(['admin', 'organizer', 'user']), listMyNotifications);
router.patch('/notifications/read-all', requireRole(['admin', 'organizer', 'user']), markAllMyNotificationsRead);
router.patch('/notifications/:notificationId/read', requireRole(['admin', 'organizer', 'user']), updateMyNotificationReadStatus);
router.get('/organizer/email-logs', requireRole('organizer'), listOrganizerEmailLogs);
router.get('/messages/inbox', requireRole(['admin', 'organizer', 'user']), listMyInboxMessages);
router.get('/messages/sent', requireRole(['admin', 'organizer', 'user']), listMySentMessages);
router.post('/messages/direct', requireRole(['organizer', 'user']), createDirectMessage);
router.get('/hero-image', getHeroImage);
router.post('/newsletter/subscribe', subscribeToNewsletter);
router.use('/auth', authRoutes);
router.post('/login', login);
router.post('/signup', signup);

module.exports = router;
