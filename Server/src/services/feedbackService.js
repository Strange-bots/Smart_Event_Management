const { readCollection, writeCollection } = require('../database/collections');
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

const getOrganizerFeedbackDetails = async (organizerEmail) => {
  const organizer = await findUserByEmail(organizerEmail);

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

  const [events, feedback] = await Promise.all([
    readCollection('events'),
    readCollection('feedback'),
  ]);
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

const submitFeedback = async ({
  userEmail,
  eventId,
  rating,
  comment,
  isAnonymous,
}) => {
  const user = await findUserByEmail(userEmail);

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

  if (!eventId) {
    return {
      error: 'A valid event is required',
      statusCode: 400,
    };
  }

  const numericRating = Number(rating);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return {
      error: 'Rating must be a whole number between 1 and 5',
      statusCode: 400,
    };
  }

  const [events, feedback] = await Promise.all([
    readCollection('events'),
    readCollection('feedback'),
  ]);
  const event = events.find((item) => String(item.id) === String(eventId));

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
      String(item.eventId) === String(event.id) &&
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
    await writeCollection('feedback', feedback);

    return {
      statusCode: 200,
      feedback: existingFeedback,
    };
  }

  const newFeedback = {
    id: `feedback-${Date.now()}`,
    eventId: event.id,
    eventTitle: event.title,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    organizerId: event.organizerId,
    organizerEmail: event.organizerEmail,
    comment: trimmedComment,
    rating: numericRating,
    dateSubmitted: submittedAt,
    isAnonymous: Boolean(isAnonymous),
  };

  feedback.push(newFeedback);
  await writeCollection('feedback', feedback);

  return {
    statusCode: 201,
    feedback: newFeedback,
  };
};

const getUserFeedback = async (userEmail) => {
  const normalizedEmail = String(userEmail || '').toLowerCase();
  const feedback = await readCollection('feedback');

  return feedback
    .filter((item) => item.userEmail?.toLowerCase() === normalizedEmail)
    .map((item) => ({
      id: item.id,
      eventId: item.eventId,
      eventTitle: item.eventTitle,
      rating: Number(item.rating) || 0,
      comment: item.comment,
      isAnonymous: Boolean(item.isAnonymous),
      dateSubmitted: item.dateSubmitted,
    }));
};

module.exports = {
  getOrganizerFeedbackDetails,
  getUserFeedback,
  submitFeedback,
};
