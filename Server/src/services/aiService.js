const OpenAI = require('openai');

const { findUserByEmail } = require('./authService');
const { getEvents } = require('./eventService');
const { getRegistrationCountForEvent } = require('./registrationService');

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const getEventStart = (event) => {
  const startTime = event.time?.split('-')[0]?.trim() ?? '12:00 AM';
  return new Date(`${event.date} ${startTime}`);
};

const getUpcomingCandidateEvents = async () => {
  const now = new Date();
  const events = await getEvents({});

  return events
    .filter((event) => getEventStart(event).getTime() > now.getTime())
    .slice(0, 12);
};

const buildFallbackRecommendations = async (limit, candidates) => {
  const recommendations = [];

  for (const event of candidates.slice(0, limit)) {
    const attendeeCount = await getRegistrationCountForEvent(event.id);
    recommendations.push({
      ...event,
      attendees: attendeeCount,
      match: Math.max(72, 96 - Math.min(20, Math.floor(attendeeCount / 5))),
      recommendationReason: 'Recommended from upcoming approved events.',
    });
  }

  return recommendations;
};

const getOpenAiClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

const buildUserContext = (user) => {
  if (!user) {
    return {
      role: 'guest',
      summary:
        'Guest visitor without a signed-in profile. Prefer broadly appealing upcoming events.',
    };
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    course: user.course || null,
    campus: user.campus || null,
    yearLevel: user.yearLevel || null,
    department: user.department || null,
    interests: Array.isArray(user.interests) ? user.interests : [],
    preferredEventCategories: user.preferences?.preferredEventCategories || [],
    bio: user.bio || '',
  };
};

const buildRecommendationPrompt = ({ user, candidates, limit }) => [
  {
    role: 'system',
    content:
      'You recommend university events for students. Choose only from the provided candidate events. Base the ranking on the user profile and event details. Keep recommendation reasons concise and practical.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      instruction: `Return up to ${limit} recommendations from the candidate events.`,
      user,
      candidateEvents: candidates.map((event) => ({
        eventId: String(event.id),
        title: event.title,
        category: event.category,
        date: event.date,
        time: event.time,
        venue: event.venue || event.location,
        price: Number(event.price || 0),
        isPaid: Boolean(event.isPaid),
        description: event.description,
        tags: event.tags || [],
      })),
    }),
  },
];

const recommendationJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          eventId: { type: 'string' },
          match: { type: 'integer', minimum: 70, maximum: 99 },
          reason: { type: 'string' },
        },
        required: ['eventId', 'match', 'reason'],
      },
    },
  },
  required: ['recommendations'],
};

const parseAiRecommendationPayload = (text) => {
  try {
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed?.recommendations)) {
      return null;
    }

    return parsed.recommendations
      .map((item) => ({
        eventId: String(item?.eventId || '').trim(),
        match: Number(item?.match),
        reason: String(item?.reason || '').trim(),
      }))
      .filter(
        (item) =>
          item.eventId &&
          Number.isFinite(item.match) &&
          item.match >= 70 &&
          item.match <= 99 &&
          item.reason,
      );
  } catch {
    return null;
  }
};

const getAiRecommendations = async ({ userEmail, limit = 3 }) => {
  const safeLimit = Math.max(1, Math.min(9, Number(limit) || 3));
  const candidates = await getUpcomingCandidateEvents();

  if (!candidates.length) {
    return {
      statusCode: 404,
      recommendations: [],
      source: 'none',
    };
  }

  const fallbackRecommendations = await buildFallbackRecommendations(safeLimit, candidates);
  const client = getOpenAiClient();

  if (!client) {
    return {
      statusCode: fallbackRecommendations.length ? 200 : 404,
      recommendations: fallbackRecommendations,
      source: 'fallback',
      reason: 'missing_api_key',
    };
  }

  const user = userEmail ? await findUserByEmail(normalizeEmail(userEmail)) : null;

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.2',
      input: buildRecommendationPrompt({
        user: buildUserContext(user),
        candidates,
        limit: safeLimit,
      }),
      text: {
        format: {
          type: 'json_schema',
          name: 'event_recommendations',
          strict: true,
          schema: recommendationJsonSchema,
        },
      },
    });

    const parsedRecommendations = parseAiRecommendationPayload(
      response.output_text || '',
    );

    if (!parsedRecommendations?.length) {
      return {
        statusCode: fallbackRecommendations.length ? 200 : 404,
        recommendations: fallbackRecommendations,
        source: 'fallback',
        reason: 'invalid_ai_payload',
      };
    }

    const eventsById = new Map(candidates.map((event) => [String(event.id), event]));
    const recommendations = [];

    for (const item of parsedRecommendations.slice(0, safeLimit)) {
      const event = eventsById.get(item.eventId);

      if (!event) {
        continue;
      }

      recommendations.push({
        ...event,
        attendees: await getRegistrationCountForEvent(event.id),
        match: Math.max(70, Math.min(99, Math.round(item.match))),
        recommendationReason: item.reason,
      });
    }

    if (!recommendations.length) {
      return {
        statusCode: fallbackRecommendations.length ? 200 : 404,
        recommendations: fallbackRecommendations,
        source: 'fallback',
        reason: 'no_matching_events',
      };
    }

    return {
      statusCode: 200,
      recommendations,
      source: 'openai',
    };
  } catch (error) {
    console.error('OpenAI recommendation request failed:', error?.message || error);

    return {
      statusCode: fallbackRecommendations.length ? 200 : 404,
      recommendations: fallbackRecommendations,
      source: 'fallback',
      reason: 'openai_request_failed',
    };
  }
};

module.exports = {
  getAiRecommendations,
};
