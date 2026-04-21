const organizerEvents = [
  {
    id: 'event-sample-1',
    title: 'AI Career Workshop',
    description:
      'A practical session on AI tools, job pathways, and industry expectations for students.',
    date: '2026-04-15',
    dateLabel: '15 April 2026',
    time: '10:00 - 12:00',
    venue: 'Conference Hall',
    location: 'Conference Hall',
    category: 'Workshop',
    capacity: 80,
    registrations: 48,
    isPaid: false,
    price: 0,
    tags: ['Technology', 'AI', 'Career'],
    organizerName: 'Demo Organizer',
    organizerEmail: 'organizer@demo.com',
    imagePreview:
      'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
    image:
      'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
    status: 'approved',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'event-sample-2',
    title: 'Campus Networking Evening',
    description:
      'Meet peers, alumni, and guest professionals in an easy-going campus networking session.',
    date: '2026-04-20',
    dateLabel: '20 April 2026',
    time: '17:00 - 19:00',
    venue: 'Main Auditorium',
    location: 'Main Auditorium',
    category: 'Networking',
    capacity: 120,
    registrations: 22,
    isPaid: true,
    price: 15,
    tags: ['Networking', 'Business', 'Professional Development'],
    organizerName: 'Demo Organizer',
    organizerEmail: 'organizer@demo.com',
    imagePreview:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    image:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    status: 'pending',
    createdAt: '2026-04-03T12:00:00.000Z',
    updatedAt: '2026-04-03T12:00:00.000Z',
  },
];

module.exports = {
  organizerEvents,
};
