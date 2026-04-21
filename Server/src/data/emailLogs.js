const emailLogs = [
  {
    id: 'email-log-1',
    organizerEmail: 'organizer@demo.com',
    eventId: 102,
    eventTitle: 'Career Networking Evening',
    audience: 'all',
    recipient: 'All Registrants',
    recipientCount: 48,
    subject: 'Important update for registered attendees',
    body:
      'Hello everyone,\n\nWe are excited to see you at the Career Networking Evening tomorrow. Please arrive 15 minutes early for check-in and bring your student ID.\n\nBest regards,\nEvent Organizer',
    status: 'sent',
    sentAt: '2026-04-07T00:30:00.000Z',
    senderName: 'Demo Organizer',
  },
  {
    id: 'email-log-2',
    organizerEmail: 'organizer@demo.com',
    eventId: 104,
    eventTitle: 'Data Science Bootcamp',
    audience: 'paid',
    recipient: 'Paid Only',
    recipientCount: 22,
    subject: 'Venue reminder and agenda',
    body:
      'Hi attendees,\n\nThis is a quick reminder that the event will take place in Computer Lab A. Networking starts at 11:00 AM followed by the workshop agenda.\n\nSee you there,\nEvent Organizer',
    status: 'sent',
    sentAt: '2026-04-05T06:15:00.000Z',
    senderName: 'Demo Organizer',
  },
  {
    id: 'email-log-3',
    organizerEmail: 'events-team@koi.edu.au',
    eventId: 103,
    eventTitle: 'Design Thinking Workshop',
    audience: 'all',
    recipient: 'All Registrants',
    recipientCount: 41,
    subject: 'Workshop reminder',
    body:
      'A reminder that the Design Thinking Workshop begins at 10:00 AM. Please be ready for collaborative breakout activities.',
    status: 'sent',
    sentAt: '2026-04-06T02:00:00.000Z',
    senderName: 'KOI Events Team',
  },
];

module.exports = {
  emailLogs,
};
