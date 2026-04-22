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

const eventBelongsToOrganizer = (event, organizerEmail) => {
  const normalizedOrganizer = organizerEmail.toLowerCase();

  return [event.organizerEmail, event.organizerId]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase() === normalizedOrganizer);
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
    (event) => eventBelongsToOrganizer(event, organizer.email),
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

const submitFeedback = ({
  userEmail,
  eventId,
  rating,
  comment,
  isAnonymous,
}) => {
  const user = findUserByEmail(userEmail);

  if (!user) {
    return {
      error: 'User account not found',
      statusCode: 404,
    };
  }

  if (user.role !== 'user') {
    return {
      error: 'Only attendees can submit feedback',
      statusCode: 403,
    };
  }

  const numericEventId = Number(eventId);
  const numericRating = Number(rating);

  if (!Number.isInteger(numericEventId)) {
    return {
      error: 'A valid event is required',
      statusCode: 400,
    };
  }

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return {
      error: 'Rating must be a whole number between 1 and 5',
      statusCode: 400,
    };
  }

  const event = events.find((item) => item.id === numericEventId);

  if (!event) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  const normalizedEmail = user.email.toLowerCase();
  const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
  const submittedAt = new Date().toISOString();

  const existingFeedback = feedback.find(
    (item) =>
      Number(item.eventId) === numericEventId &&
      item.userEmail?.toLowerCase() === normalizedEmail,
  );

  if (existingFeedback) {
    existingFeedback.rating = numericRating;
    existingFeedback.comment = trimmedComment;
    existingFeedback.isAnonymous = Boolean(isAnonymous);
    existingFeedback.userName = user.name;
    existingFeedback.eventTitle = event.title;
    existingFeedback.organizerEmail = event.organizerEmail;
    existingFeedback.userEmail = user.email;
    existingFeedback.dateSubmitted = submittedAt;

    return {
      statusCode: 200,
      feedback: existingFeedback,
    };
  }

  const newFeedback = {
    id: `feedback-${Date.now()}`,
    eventId: event.id,
    eventTitle: event.title,
    userEmail: user.email,
    userName: user.name,
    comment: trimmedComment,
    rating: numericRating,
    dateSubmitted: submittedAt,
    isAnonymous: Boolean(isAnonymous),
    organizerEmail: event.organizerEmail,
  };

  feedback.push(newFeedback);

  return {
    statusCode: 201,
    feedback: newFeedback,
  };
};

module.exports = {
  getOrganizerFeedbackDetails,
  submitFeedback,
};
