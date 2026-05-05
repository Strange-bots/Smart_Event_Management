const { readCollection } = require('../database/collections');
const { findUserByEmail } = require('./authService');

const DEFAULT_GEMINI_MODEL = 'gemini-flash-lite-latest';
const MAX_CANDIDATES_FOR_AI = 6;
const CACHE_TTL_MS = 10 * 60 * 1000;
const recommendationCache = new Map();

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const getEventStart = (event) => {
  const startTime = event.time?.split('-')[0]?.trim() ?? '12:00 AM';
  return new Date(`${event.date} ${startTime}`);
};

const getRegistrationCountForEventFrom = (registrations, eventId) =>
  registrations.filter(
    (registration) =>
      String(registration.eventId) === String(eventId) &&
      registration.attendanceStatus !== 'cancelled',
  ).length;

const getUpcomingCandidateEvents = async () => {
  const now = new Date();
  const eventCollection = await readCollection('events');

  return eventCollection
    .filter((event) => event.status === 'approved')
    .filter((event) => getEventStart(event).getTime() > now.getTime())
    .sort((left, right) => getEventStart(left) - getEventStart(right))
    .slice(0, 12);
};

const buildFallbackRecommendations = async (limit, candidates, registrations) => {
  const recommendations = [];

  for (const event of candidates.slice(0, limit)) {
    const attendeeCount = getRegistrationCountForEventFrom(registrations, event.id);
    recommendations.push({
      ...event,
      attendees: attendeeCount,
      match: Math.max(72, 96 - Math.min(20, Math.floor(attendeeCount / 5))),
      recommendationReason: 'Recommended from upcoming approved events.',
    });
  }

  return recommendations;
};

const getGeminiConfig = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  };
};

const buildUserContext = (user) => {
  if (!user) {
    return {
      role: 'guest',
      interests: [],
      preferredEventCategories: [],
    };
  }

  return {
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

const clampText = (value, maxLength) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
    : normalized;
};

const getCandidatePriority = (event, userContext, attendeeCount) => {
  let score = 0;
  const preferredCategories = new Set(
    (userContext.preferredEventCategories || []).map((value) =>
      String(value).trim().toLowerCase(),
    ),
  );
  const interests = (userContext.interests || []).map((value) =>
    String(value).trim().toLowerCase(),
  );
  const category = String(event.category || '').toLowerCase();
  const tags = Array.isArray(event.tags)
    ? event.tags.map((value) => String(value).trim().toLowerCase())
    : [];
  const titleAndDescription = `${event.title || ''} ${event.description || ''}`.toLowerCase();

  if (preferredCategories.has(category)) {
    score += 30;
  }

  for (const interest of interests) {
    if (category.includes(interest)) {
      score += 12;
      continue;
    }

    if (tags.some((tag) => tag.includes(interest) || interest.includes(tag))) {
      score += 8;
      continue;
    }

    if (interest && titleAndDescription.includes(interest)) {
      score += 6;
    }
  }

  score += Math.min(20, attendeeCount);
  score += event.isPaid ? 0 : 4;

  return score;
};

const selectAiCandidates = (candidates, registrations, userContext) =>
  candidates
    .map((event) => ({
      event,
      attendeeCount: getRegistrationCountForEventFrom(registrations, event.id),
    }))
    .sort((left, right) => {
      const scoreDifference =
        getCandidatePriority(right.event, userContext, right.attendeeCount) -
        getCandidatePriority(left.event, userContext, left.attendeeCount);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return getEventStart(left.event) - getEventStart(right.event);
    })
    .slice(0, MAX_CANDIDATES_FOR_AI)
    .map(({ event, attendeeCount }) => ({
      eventId: String(event.id),
      title: clampText(event.title, 60),
      category: event.category,
      date: event.date,
      price: Number(event.price || 0),
      isPaid: Boolean(event.isPaid),
      attendees: attendeeCount,
      tags: Array.isArray(event.tags) ? event.tags.slice(0, 4) : [],
      description: clampText(event.description, 140),
    }));

const buildRecommendationPrompt = ({ user, candidates, limit }) => JSON.stringify({
  task: 'Choose the best campus event recommendations.',
  maxRecommendations: limit,
  user,
  candidateEvents: candidates,
});

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

const extractGeminiText = (responseBody) => {
  const parts = responseBody?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => part?.text || '')
    .join('')
    .trim();
};

const requestGeminiRecommendations = async ({
  apiKey,
  model,
  user,
  candidates,
  limit,
}) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const prompt = [
    'You recommend university events for students.',
    'Choose only from the provided candidate events.',
    'Return valid JSON only with this exact shape:',
    '{"recommendations":[{"eventId":"string","match":70-99,"reason":"string"}]}',
    'Do not include markdown fences or any extra text.',
    buildRecommendationPrompt({ user, candidates, limit }),
  ].join('\n\n');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  eventId: { type: 'string' },
                  match: { type: 'number' },
                  reason: { type: 'string' },
                },
                required: ['eventId', 'match', 'reason'],
              },
            },
          },
          required: ['recommendations'],
        },
        maxOutputTokens: 220,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed (${response.status}): ${errorText}`);
  }

  return response.json();
};

const buildCacheKey = ({ userContext, limit, candidates }) => {
  const userSignature = JSON.stringify({
    role: userContext.role,
    course: userContext.course || null,
    campus: userContext.campus || null,
    yearLevel: userContext.yearLevel || null,
    department: userContext.department || null,
    interests: (userContext.interests || []).slice(0, 5),
    preferredEventCategories: (userContext.preferredEventCategories || []).slice(0, 5),
  });
  const eventSignature = candidates
    .map((event) => `${event.eventId}:${event.date || ''}`)
    .join('|');

  return `${limit}:${userSignature}:${eventSignature}`;
};

const getCachedRecommendations = (cacheKey) => {
  const cachedEntry = recommendationCache.get(cacheKey);

  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    recommendationCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.value;
};

const setCachedRecommendations = (cacheKey, value) => {
  recommendationCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const getAiRecommendations = async ({ userEmail, limit = 3 }) => {
  const safeLimit = Math.max(1, Math.min(9, Number(limit) || 3));
  const taskDataFromMongo = await Promise.all([
    getUpcomingCandidateEvents(),
    readCollection('registrations'),
  ]);
  const [candidateEventsConst, registrationsConst] = taskDataFromMongo;

  console.log('AI recommendations MongoDB fetch:', {
    candidateEventsConst,
  });

  if (!candidateEventsConst.length) {
    return {
      statusCode: 404,
      recommendations: [],
      source: 'none',
      modelResult: null,
    };
  }

  const fallbackRecommendations = await buildFallbackRecommendations(
    safeLimit,
    candidateEventsConst,
    registrationsConst,
  );
  const geminiConfig = getGeminiConfig();

  if (!geminiConfig) {
    return {
      statusCode: fallbackRecommendations.length ? 200 : 404,
      recommendations: fallbackRecommendations,
      source: 'fallback',
      reason: 'missing_api_key',
      modelResult: null,
    };
  }

  const user = userEmail ? await findUserByEmail(normalizeEmail(userEmail)) : null;
  const userContext = buildUserContext(user);
  const aiPayloadConst = selectAiCandidates(
    candidateEventsConst,
    registrationsConst,
    userContext,
  );
  const cacheKey = buildCacheKey({
    userContext,
    limit: safeLimit,
    candidates: aiPayloadConst,
  });
  const cachedRecommendations = getCachedRecommendations(cacheKey);

  if (cachedRecommendations) {
    return cachedRecommendations;
  }

  try {
    const geminiResponseConst = await requestGeminiRecommendations({
      ...geminiConfig,
      user: userContext,
      candidates: aiPayloadConst,
      limit: safeLimit,
    });
    const modelResult = extractGeminiText(geminiResponseConst);
    const parsedRecommendations = parseAiRecommendationPayload(modelResult);

    if (!parsedRecommendations?.length) {
      return {
        statusCode: fallbackRecommendations.length ? 200 : 404,
        recommendations: fallbackRecommendations,
        source: 'fallback',
        reason: 'invalid_ai_payload',
        modelResult,
      };
    }

    const eventsById = new Map(
      candidateEventsConst.map((event) => [String(event.id), event]),
    );
    const recommendations = [];

    for (const item of parsedRecommendations.slice(0, safeLimit)) {
      const event = eventsById.get(item.eventId);

      if (!event) {
        continue;
      }

      recommendations.push({
        ...event,
        attendees: getRegistrationCountForEventFrom(registrationsConst, event.id),
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
        modelResult,
      };
    }

    const result = {
      statusCode: 200,
      recommendations,
      source: 'gemini',
      modelResult,
    };

    setCachedRecommendations(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Gemini recommendation request failed:', error?.message || error);

    return {
      statusCode: fallbackRecommendations.length ? 200 : 404,
      recommendations: fallbackRecommendations,
      source: 'fallback',
      reason: 'gemini_request_failed',
      modelResult: error?.message || null,
    };
  }
};

module.exports = {
  getAiRecommendations,
};
