const { events } = require('../data/events');
const { feedback } = require('../data/feedback');
const { findUserByEmail, sanitizeUser } = require('./authService');

const formatFeedbackDate = (dateString) => {
  if (!dateString) {
    return '';
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
};

const getOrganizerFeedbackDetails = (organizerEmail) => {
  const organizer = findUserByEmail(organizerEmail);

  if (!organizer) {
    return {
      error: 'Organizer account not found',
      statusCode: 404,
    };
  }

  if (organizer.role !== 'organizer') {
    return {
      error: 'Only organizers can access feedback details',
      statusCode: 403,
    };
  }

  const organizerEvents = events.filter(
    (event) => event.organizerEmail?.toLowerCase() === organizer.email.toLowerCase(),
  );
  const organizerEventIds = new Set(organizerEvents.map((event) => event.id));

  const organizerFeedback = feedback
    .filter((item) => organizerEventIds.has(item.eventId))
    .sort((left, right) => new Date(right.dateSubmitted) - new Date(left.dateSubmitted))
    .map((item) => ({
      id: item.id,
      eventId: item.eventId,
      eventTitle: item.eventTitle,
      userName: item.isAnonymous ? 'Anonymous' : item.userName,
      comment: item.comment,
      rating: Number(item.rating) || 0,
      dateSubmitted: formatFeedbackDate(item.dateSubmitted),
      submittedAt: item.dateSubmitted,
      isAnonymous: Boolean(item.isAnonymous),
    }));

  const totalReviews = organizerFeedback.length;
  const averageRating = totalReviews
    ? Number(
        (
          organizerFeedback.reduce((sum, item) => sum + item.rating, 0) /
          totalReviews
        ).toFixed(1),
      )
    : 0;
  const positiveReviews = organizerFeedback.filter((item) => item.rating >= 4).length;

  const reviewsByEvent = organizerEvents.map((event) => {
    const eventFeedback = organizerFeedback.filter((item) => item.eventId === event.id);
    const eventAverageRating = eventFeedback.length
      ? Number(
          (
            eventFeedback.reduce((sum, item) => sum + item.rating, 0) /
            eventFeedback.length
          ).toFixed(1),
        )
      : 0;

    return {
      eventId: event.id,
      eventTitle: event.title,
      totalReviews: eventFeedback.length,
      averageRating: eventAverageRating,
    };
  });

  return {
    statusCode: 200,
    organizer: sanitizeUser(organizer),
    feedback: organizerFeedback,
    analytics: {
      averageRating,
      totalReviews,
      positiveReviews,
      reviewsByEvent,
    },
  };
};

module.exports = {
  getOrganizerFeedbackDetails,
};
