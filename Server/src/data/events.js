const events = [
  {
    id: 102,
    title: 'Career Networking Evening',
    description:
      'Meet mentors, alumni, and hiring partners across business and technology.',
    date: '2026-05-14',
    time: '05:30 PM - 08:00 PM',
    location: 'Innovation Hub',
    category: 'Career',
    capacity: 120,
    registrations: 0,
    organizerId: 'organizer@demo.com',
    organizerEmail: 'organizer@demo.com',
    status: 'approved',
    image:
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
  },
  {
    id: 103,
    title: 'Design Thinking Workshop',
    description:
      'An interactive session on problem framing, rapid prototyping, and user feedback.',
    date: '2026-06-03',
    time: '10:00 AM - 01:00 PM',
    location: 'Room 301',
    category: 'Workshop',
    capacity: 60,
    registrations: 0,
    organizerId: 'events-team@koi.edu.au',
    organizerEmail: 'events-team@koi.edu.au',
    status: 'pending',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  },
  {
    id: 104,
    title: 'Data Science Bootcamp',
    description:
      'Hands-on labs covering data wrangling, visualization, and machine learning basics.',
    date: '2026-06-18',
    time: '11:00 AM - 03:00 PM',
    location: 'Computer Lab A',
    category: 'Technology',
    capacity: 90,
    registrations: 0,
    organizerId: 'organizer@demo.com',
    organizerEmail: 'organizer@demo.com',
    status: 'approved',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
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
    registrations: 0,
    isPaid: false,
    price: 0,
    tags: ['Technology', 'AI', 'Career'],
    organizerId: 'organizer@demo.com',
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
    registrations: 0,
    isPaid: true,
    price: 15,
    tags: ['Networking', 'Business', 'Professional Development'],
    organizerId: 'organizer@demo.com',
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
  events,
};
