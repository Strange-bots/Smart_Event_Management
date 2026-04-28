const { registeredUsers } = require('../data/registeredUsers');
const { events } = require('../data/events');
const { registrations } = require('../data/registrations');
const { findUserByEmail, sanitizeUser } = require('./authService');
const { getRegistrationCountForEvent } = require('./registrationService');

const DASHBOARD_COLORS = ['#1F4E79', '#F36F21', '#6D5DF6', '#6B7C93', '#16A34A', '#DC2626'];

const getEventVenue = (event) => event.venue || event.location || 'TBA';

const getEventStartDate = (event) => {
  const startTime = event.time?.split('-')[0]?.trim() ?? '12:00 AM';
  return new Date(`${event.date} ${startTime}`);
};

const isSameMonth = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth();

const formatMonthLabel = (date) =>
  date.toLocaleString('en-US', {
    month: 'short',
  });

const getMonthBuckets = (bucketCount = 6) => {
  const current = new Date();
  current.setDate(1);
  current.setHours(0, 0, 0, 0);

  return Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(current);
    date.setMonth(current.getMonth() - (bucketCount - index - 1));

    return {
      label: formatMonthLabel(date),
      date,
      events: 0,
    };
  });
};

const getUniqueUsers = () => {
  const seenEmails = new Set();

  return registeredUsers.filter((user) => {
    const normalizedEmail = user.email.toLowerCase();

    if (seenEmails.has(normalizedEmail)) {
      return false;
    }

    seenEmails.add(normalizedEmail);
    return true;
  });
};

const getAdminDashboardOverview = (adminEmail) => {
  const adminUser = findUserByEmail(adminEmail);

  if (!adminUser) {
    return {
      error: 'Admin account not found',
      statusCode: 404,
    };
  }

  if (adminUser.role !== 'admin') {
    return {
      error: 'Only admins can access dashboard overview stats',
      statusCode: 403,
    };
  }

  const totalUsers = getUniqueUsers().length;
  const totalEvents = events.length;
  const paidRegistrationCount = registrations.filter(
    (registration) => registration.paymentStatus === 'paid',
  ).length;
  const totalRevenue = events.reduce((sum, event) => {
    const paidRegistrationCountForEvent = registrations.filter(
      (registration) =>
        String(registration.eventId) === String(event.id) &&
        registration.paymentStatus === 'paid' &&
        registration.attendanceStatus !== 'cancelled',
    ).length;
    const ticketPrice = Number(event.price || 0);

    if (!event.isPaid || ticketPrice <= 0 || paidRegistrationCountForEvent <= 0) {
      return sum;
    }

    return sum + paidRegistrationCountForEvent * ticketPrice;
  }, 0);
  const currentMonth = new Date();
  const eventsThisMonth = events.filter((event) =>
    isSameMonth(getEventStartDate(event), currentMonth)
  ).length;
  const approvedEvents = events.filter((event) => event.status === 'approved').length;
  const pendingEvents = events.filter((event) => event.status === 'pending').length;
  const rejectedEvents = events.filter((event) => event.status === 'rejected').length;
  const activeVenues = new Set(events.map(getEventVenue)).size;
  const eventsByMonth = getMonthBuckets().map((bucket) => ({
    ...bucket,
    events: events.filter((event) => isSameMonth(getEventStartDate(event), bucket.date)).length,
  }));
  const venueCounts = events.reduce((accumulator, event) => {
    const venue = getEventVenue(event);
    accumulator.set(venue, (accumulator.get(venue) ?? 0) + 1);
    return accumulator;
  }, new Map());
  const venueDistribution = [...venueCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: DASHBOARD_COLORS[index % DASHBOARD_COLORS.length],
    }));
  const calendarEvents = events
    .slice()
    .sort((left, right) => getEventStartDate(left) - getEventStartDate(right))
    .map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      venue: getEventVenue(event),
      status: event.status,
      registrations: getRegistrationCountForEvent(event.id),
      capacity: event.capacity,
    }));

  return {
    statusCode: 200,
    admin: sanitizeUser(adminUser),
    stats: {
      totalUsers,
      totalEvents,
      totalRevenue,
      currency: 'AUD',
      paidRegistrationCount,
      eventsThisMonth,
      approvedEvents,
      pendingEvents,
      rejectedEvents,
      activeVenues,
    },
    eventsByMonth,
    venueDistribution,
    calendarEvents,
  };
};

module.exports = {
  getAdminDashboardOverview,
};
