const express = require('express');

const { getApiStatus, getEventStats, getHeroImage } = require('../controllers/indexController');
const { login, signup } = require('../controllers/authController');
const { getRecommendations } = require('../controllers/AiServiceController');
const {
  generateOrganizerEventDescription,
  suggestOrganizerEventTags,
  suggestOrganizerEventTimes,
} = require('../controllers/organizerAiController');
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
const {
  deleteMyPaymentPreference,
  getMyPaymentPreference,
  upsertMyPaymentPreference,
} = require('../controllers/paymentPreferenceController');
const {
  confirmStripeCheckout,
  createStripeCheckout,
  listMyPayments,
} = require('../controllers/paymentController');
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
const {
  getAdminMailTemplates,
  getOrganizerMailTemplates,
} = require('../controllers/mailAiController');
const {
  listAdminEventReviewRecommendations,
} = require('../controllers/adminEventAiController');
const { getAdminOverviewStats } = require('../controllers/adminDashboardController');
const { getRoleScopedCalendar } = require('../controllers/calendarController');
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
router.get('/admin/events/ai-recommendations', requireRole('admin'), listAdminEventReviewRecommendations);
router.get('/admin/gallery', requireRole('admin'), listAdminGalleryImages);
router.patch('/admin/events/:eventId/approve', requireRole('admin'), approveAdminEventRecord);
router.patch('/admin/events/:eventId/reject', requireRole('admin'), rejectAdminEventRecord);
router.delete('/admin/events/:eventId', requireRole('admin'), deleteAdminEventRecord);
router.delete('/admin/events/:eventId/image', requireRole('admin'), deleteAdminEventImageRecord);
router.post('/events/:eventId/registrations', requireRole('user'), createEventRegistration);
router.get('/users/events', requireRole('user'), listCurrentUserEventRegistrations);
router.get('/organizer/events', requireRole('organizer'), listOrganizerEvents);
router.post('/organizer/events', requireRole('organizer'), createOrganizerEventRecord);
router.post('/organizer/events/ai/description', requireRole('organizer'), generateOrganizerEventDescription);
router.post('/organizer/events/ai/tags', requireRole('organizer'), suggestOrganizerEventTags);
router.post('/organizer/events/ai/time-suggestions', requireRole('organizer'), suggestOrganizerEventTimes);
router.put('/organizer/events/:eventId', requireRole('organizer'), updateOrganizerEventRecord);
router.post('/organizer/events/:eventId/duplicate', requireRole('organizer'), duplicateOrganizerEventRecord);
router.delete('/organizer/events/:eventId', requireRole('organizer'), deleteOrganizerEventRecord);
router.post('/admin/events/:eventId/image', requireRole('admin'), uploadEventImage);
router.get('/admin/dashboard/overview', requireRole('admin'), getAdminOverviewStats);
router.get('/calendar/events', requireRole(['admin', 'organizer', 'user']), getRoleScopedCalendar);
router.get('/admin/messages', requireRole('admin'), listAdminMessages);
router.post('/admin/messages', requireRole('admin'), createAdminMessage);
router.post('/admin/messages/ai-templates', requireRole('admin'), getAdminMailTemplates);
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
router.post('/organizer/messages/ai-templates', requireRole('organizer'), getOrganizerMailTemplates);
router.get('/feedback/my', requireRole('user'), listMyFeedback);
router.post('/feedback', requireRole('user'), createFeedback);
router.get('/organizer/registrations', requireRole('organizer'), listOrganizerRegistrations);
router.get('/user-history', requireRole(['admin', 'organizer']), listUserHistoryRecords);
router.post('/user-history/reports', requireRole(['admin', 'organizer']), createUserHistoryReportRecord);
router.get('/organizer/notifications', requireRole('organizer'), listOrganizerNotifications);
router.patch('/organizer/notifications/read-all', requireRole('organizer'), markAllOrganizerNotificationsRead);
router.patch('/organizer/notifications/:notificationId/read', requireRole('organizer'), updateOrganizerNotificationReadStatus);
router.post('/events/:eventId/stripe-checkout-session', requireRole('user'), createStripeCheckout);
router.get('/payment-preferences/me', requireRole(['admin', 'organizer', 'user']), getMyPaymentPreference);
router.put('/payment-preferences/me', requireRole(['admin', 'organizer', 'user']), upsertMyPaymentPreference);
router.delete('/payment-preferences/me', requireRole(['admin', 'organizer', 'user']), deleteMyPaymentPreference);
router.get('/payments/me', requireRole('user'), listMyPayments);
router.post('/payments/stripe/confirm-session', requireRole('user'), confirmStripeCheckout);
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
