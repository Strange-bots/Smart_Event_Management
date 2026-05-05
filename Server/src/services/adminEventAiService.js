const { readCollection } = require('../database/collections');
const { findUserByEmail } = require('./authService');

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const clampText = (value, maxLength) => {
  const normalized = normalizeText(value);
  return normalized.length > maxLength
    ? `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
    : normalized;
};

const getGeminiConfig = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return {
    apiKey: process.env.GEMINI_API_KEY,
    model: DEFAULT_GEMINI_MODEL,
  };
};

const extractGeminiText = (responseBody) => {
  const parts = responseBody?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return '';
  }

  return parts.map((part) => part?.text || '').join('').trim();
};

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const requestGeminiJson = async ({ prompt, schema }) => {
  const geminiConfig = getGeminiConfig();

  if (!geminiConfig) {
    return {
      source: 'fallback',
      reason: 'missing_api_key',
      modelResult: null,
      parsed: null,
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    geminiConfig.model,
  )}:generateContent?key=${encodeURIComponent(geminiConfig.apiKey)}`;

  try {
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
          responseJsonSchema: schema,
          maxOutputTokens: 900,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        source: 'fallback',
        reason: 'gemini_request_failed',
        modelResult: `Gemini API request failed (${response.status}): ${errorText}`,
        parsed: null,
      };
    }

    const responseBody = await response.json();
    const modelResult = extractGeminiText(responseBody);
    const parsed = parseJson(modelResult);

    if (!parsed) {
      return {
        source: 'fallback',
        reason: 'invalid_ai_payload',
        modelResult,
        parsed: null,
      };
    }

    return {
      source: 'gemini',
      reason: null,
      modelResult,
      parsed,
    };
  } catch (error) {
    return {
      source: 'fallback',
      reason: 'gemini_request_failed',
      modelResult: error?.message || null,
      parsed: null,
    };
  }
};

const getRegistrationCountForEventFrom = (registrations, eventId) =>
  registrations.filter(
    (registration) =>
      String(registration.eventId) === String(eventId) &&
      registration.attendanceStatus !== 'cancelled',
  ).length;

const buildFallbackRecommendation = ({ event, organizer, attendeeCount }) => {
  const confidenceBase = 72;
  let confidence = confidenceBase;
  let recommendation = 'review';
  const reasons = [];

  if (organizer?.status && organizer.status !== 'active') {
    confidence = 91;
    recommendation = 'reject';
    reasons.push(`Organizer account status is ${organizer.status}.`);
  }

  if (!event.title || !event.description || !event.venue || !event.date || !event.time) {
    confidence = Math.max(confidence, 88);
    recommendation = 'review';
    reasons.push('Core event details are incomplete.');
  }

  if (event.capacity && Number(event.capacity) > 0 && attendeeCount > Number(event.capacity)) {
    confidence = 94;
    recommendation = 'reject';
    reasons.push('Registrations already exceed stated capacity.');
  }

  const descriptionLength = normalizeText(event.description).length;
  if (descriptionLength >= 80 && descriptionLength <= 700) {
    confidence += 8;
    reasons.push('Description has reasonable detail for review.');
  } else {
    confidence = Math.max(confidence, 82);
    reasons.push('Description may be too short or too long.');
  }

  if (Array.isArray(event.tags) && event.tags.length >= 2) {
    confidence += 4;
    reasons.push('Event tags are present.');
  }

  if (!event.isPaid || Number(event.price || 0) > 0) {
    confidence += 3;
    reasons.push('Pricing information looks internally consistent.');
  } else {
    confidence = Math.max(confidence, 86);
    reasons.push('Paid event pricing appears inconsistent.');
  }

  if (recommendation !== 'reject' && confidence >= 84) {
    recommendation = 'approve';
  }

  return {
    eventId: event.id,
    recommendation,
    confidence: Math.max(70, Math.min(97, Math.round(confidence))),
    reason: reasons.join(' '),
  };
};

const getAdminEventReviewRecommendations = async () => {
  const [events, registrations] = await Promise.all([
    readCollection('events'),
    readCollection('registrations'),
  ]);

  const pendingEventsConst = events
    .filter((event) => Boolean(event.organizerEmail || event.organizerId))
    .filter((event) => event.status === 'pending');

  if (!pendingEventsConst.length) {
    return {
      statusCode: 200,
      recommendations: [],
      source: 'none',
      reason: null,
      modelResult: null,
    };
  }

  const organizerEmails = Array.from(
    new Set(
      pendingEventsConst
        .map((event) => String(event.organizerEmail || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const organizersConst = await Promise.all(
    organizerEmails.map((email) => findUserByEmail(email)),
  );
  const organizersByEmailConst = new Map(
    organizersConst.filter(Boolean).map((organizer) => [String(organizer.email).toLowerCase(), organizer]),
  );

  const mongoTaskConst = pendingEventsConst.map((event) => {
    const organizer = organizersByEmailConst.get(String(event.organizerEmail || '').toLowerCase()) || null;
    const attendeeCount = getRegistrationCountForEventFrom(registrations, event.id);

    return {
      eventId: String(event.id),
      title: clampText(event.title, 70),
      category: event.category,
      date: event.date,
      time: event.time,
      venue: event.venue || event.location,
      description: clampText(event.description, 220),
      capacity: Number(event.capacity || 0),
      registrations: attendeeCount,
      isPaid: Boolean(event.isPaid),
      price: Number(event.price || 0),
      tags: Array.isArray(event.tags) ? event.tags.slice(0, 5) : [],
      organizer: organizer
        ? {
            name: organizer.name,
            status: organizer.status,
            department: organizer.department || null,
            course: organizer.course || null,
          }
        : null,
    };
  });

  const geminiResponseConst = await requestGeminiJson({
    prompt: JSON.stringify({
      task: 'Review pending organizer events for admin approval.',
      events: mongoTaskConst,
      rules: [
        'For each event return recommendation approve, review, or reject.',
        'Confidence must be an integer from 70 to 99.',
        'Reason must be one concise sentence focused on moderation and quality.',
        'Only use the provided event and organizer data.',
      ],
    }),
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              recommendation: { type: 'string' },
              confidence: { type: 'integer' },
              reason: { type: 'string' },
            },
            required: ['eventId', 'recommendation', 'confidence', 'reason'],
          },
        },
      },
      required: ['recommendations'],
    },
  });

  const parsedRecommendationsConst = Array.isArray(geminiResponseConst.parsed?.recommendations)
    ? geminiResponseConst.parsed.recommendations
        .map((item) => ({
          eventId: String(item?.eventId || '').trim(),
          recommendation: normalizeText(item?.recommendation).toLowerCase(),
          confidence: Number(item?.confidence),
          reason: normalizeText(item?.reason),
        }))
        .filter(
          (item) =>
            item.eventId &&
            ['approve', 'review', 'reject'].includes(item.recommendation) &&
            Number.isFinite(item.confidence) &&
            item.confidence >= 70 &&
            item.confidence <= 99 &&
            item.reason,
        )
    : [];

  if (parsedRecommendationsConst.length) {
    return {
      statusCode: 200,
      recommendations: parsedRecommendationsConst,
      source: geminiResponseConst.source,
      reason: geminiResponseConst.reason,
      modelResult: geminiResponseConst.modelResult,
    };
  }

  const fallbackRecommendationsConst = pendingEventsConst.map((event) =>
    buildFallbackRecommendation({
      event,
      organizer: organizersByEmailConst.get(String(event.organizerEmail || '').toLowerCase()) || null,
      attendeeCount: getRegistrationCountForEventFrom(registrations, event.id),
    }),
  );

  return {
    statusCode: 200,
    recommendations: fallbackRecommendationsConst,
    source: 'fallback',
    reason: geminiResponseConst.reason || 'invalid_ai_payload',
    modelResult: geminiResponseConst.modelResult,
  };
};

module.exports = {
  getAdminEventReviewRecommendations,
};
