const messages = [
  {
    id: 'message-1',
    senderEmail: 'admin@demo.com',
    senderName: 'Demo Admin',
    senderRole: 'admin',
    recipientEmail: 'organizer@demo.com',
    recipientName: 'Demo Organizer',
    recipientRole: 'organizer',
    subject: 'Event review update',
    body:
      'Your latest event submissions are visible in the admin review queue. Please check the dashboard for approval notes.',
    sentAt: '2026-04-12T04:30:00.000Z',
    isRead: false,
    relatedEntityType: 'system',
    relatedEntityId: null,
  },
  {
    id: 'message-2',
    senderEmail: 'organizer@demo.com',
    senderName: 'Demo Organizer',
    senderRole: 'organizer',
    recipientEmail: 'user@demo.com',
    recipientName: 'Demo User',
    recipientRole: 'user',
    subject: 'Reminder: AI Career Workshop',
    body:
      'This is a quick reminder that the AI Career Workshop begins at 10:00 AM in the Conference Hall. Please arrive early for check-in.',
    sentAt: '2026-04-13T01:15:00.000Z',
    isRead: false,
    relatedEntityType: 'event',
    relatedEntityId: 'event-sample-1',
  },
];

module.exports = {
  messages,
};
