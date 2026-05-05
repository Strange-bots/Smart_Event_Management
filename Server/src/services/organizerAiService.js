const { readCollection } = require('../database/collections');
const { findUserByEmail } = require('./authService');

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

const timeSuggestionsByCategory = {
  workshop: [
    { startTime: '10:00', endTime: '12:00', reason: 'Late morning workshops usually get strong attendance.' },
    { startTime: '14:00', endTime: '16:00', reason: 'A mid-afternoon slot works well for hands-on sessions.' },
  ],
  seminar: [
    { startTime: '11:00', endTime: '12:30', reason: 'Seminars often work best before lunch.' },
    { startTime: '15:00', endTime: '16:30', reason: 'Afternoon seminars fit well between classes.' },
  ],
  networking: [
    { startTime: '17:00', endTime: '19:00', reason: 'Networking events usually feel more natural in the evening.' },
    { startTime: '16:30', endTime: '18:00', reason: 'This slot works well after the day winds down.' },
  ],
};

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

const buildFallbackDescription = ({ title, category, venue, capacity, isPaid, price, tags }) => {
  const tagLine = tags.length ? ` Topics include ${tags.join(', ')}.` : '';
  const priceLine = isPaid && price ? ` Tickets are $${price}.` : ' This event is free to attend.';
  return `${title} is a ${category || 'campus'} event designed to bring the community together at ${venue || 'our campus venue'}. It is planned for up to ${capacity || 'a select number of'} attendees and aims to deliver an engaging experience.${tagLine}${priceLine}`;
};

const buildFallbackTags = ({ title, category, selectedTags = [] }) => {
  const availableTags = ['Technology', 'Business', 'Career', 'Workshop', 'Networking', 'Academic', 'Cultural', 'Sports', 'AI', 'Data Science', 'Leadership', 'Finance', 'Marketing', 'Innovation', 'Professional Development'];
  const haystack = `${title} ${category}`.toLowerCase();

  let suggestions = [];

  if (haystack.includes('tech') || haystack.includes('ai')) suggestions = ['Technology', 'AI', 'Innovation', 'Data Science'];
  else if (haystack.includes('career') || haystack.includes('job')) suggestions = ['Career', 'Leadership', 'Professional Development', 'Business'];
  else if (haystack.includes('sport')) suggestions = ['Sports', 'Networking'];
  else if (haystack.includes('culture')) suggestions = ['Cultural', 'Networking'];
  else suggestions = availableTags.filter((tag) => tag.toLowerCase() === String(category || '').toLowerCase());

  return suggestions.filter((tag) => !selectedTags.includes(tag)).slice(0, 5);
};

const buildFallbackTimeSuggestions = (category) =>
  timeSuggestionsByCategory[String(category || '').toLowerCase()] || [
    { startTime: '10:00', endTime: '12:00', reason: 'This is a balanced daytime slot for most campus events.' },
    { startTime: '13:00', endTime: '15:00', reason: 'A post-lunch session is a good general option.' },
  ];

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const extractGeminiText = (responseBody) => {
  const parts = responseBody?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return '';
  }

  return parts.map((part) => part?.text || '').join('').trim();
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
          maxOutputTokens: 320,
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

    const responseBodyConst = await response.json();
    const modelResultConst = extractGeminiText(responseBodyConst);
    const parsedConst = parseJson(modelResultConst);

    if (!parsedConst) {
      return {
        source: 'fallback',
        reason: 'invalid_ai_payload',
        modelResult: modelResultConst,
        parsed: null,
      };
    }

    return {
      source: 'gemini',
      reason: null,
      modelResult: modelResultConst,
      parsed: parsedConst,
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

const buildOrganizerContext = async (organizerEmail) => {
  const [organizerConst, eventsConst] = await Promise.all([
    findUserByEmail(organizerEmail),
    readCollection('events'),
  ]);

  const organizerEventsConst = eventsConst
    .filter(
      (event) =>
        String(event.organizerEmail || '').toLowerCase() === String(organizerEmail).toLowerCase(),
    )
    .slice(0, 5)
    .map((event) => ({
      title: clampText(event.title, 50),
      category: event.category,
      venue: event.venue || event.location,
      tags: Array.isArray(event.tags) ? event.tags.slice(0, 4) : [],
    }));

  const categoryExamplesConst = eventsConst
    .filter((event) => event.status === 'approved')
    .slice(0, 30);

  return {
    organizerConst,
    organizerEventsConst,
    categoryExamplesConst,
  };
};

const generateEventDescription = async ({ organizerEmail, payload = {} }) => {
  const taskDataFromMongoConst = await buildOrganizerContext(organizerEmail);
  const {
    organizerConst,
    organizerEventsConst,
    categoryExamplesConst,
  } = taskDataFromMongoConst;

  const requestDataConst = {
    title: normalizeText(payload.title),
    category: normalizeText(payload.category),
    venue: normalizeText(payload.venue),
    capacity: Number(payload.capacity || 0),
    isPaid: Boolean(payload.isPaid),
    price: Number(payload.price || 0),
    tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 5) : [],
  };

  if (!requestDataConst.title) {
    return {
      statusCode: 400,
      error: 'Event title is required',
    };
  }

  const categoryReferenceConst = categoryExamplesConst
    .filter(
      (event) =>
        String(event.category || '').toLowerCase() ===
        String(requestDataConst.category || '').toLowerCase(),
    )
    .slice(0, 4)
    .map((event) => ({
      title: clampText(event.title, 50),
      tags: Array.isArray(event.tags) ? event.tags.slice(0, 4) : [],
      venue: event.venue || event.location,
    }));

  const geminiPayloadConst = {
    task: 'Write a concise but attractive campus event description for an organizer.',
    organizer: organizerConst
      ? {
          role: organizerConst.role,
          department: organizerConst.department || null,
          course: organizerConst.course || null,
        }
      : null,
    organizerRecentEvents: organizerEventsConst,
    similarApprovedEvents: categoryReferenceConst,
    eventDraft: requestDataConst,
    rules: [
      'Return one polished paragraph.',
      'Keep it between 60 and 120 words.',
      'Do not invent unavailable logistics like guest speakers or sponsors.',
      'Mention whether the event is free or paid.',
    ],
  };

  const geminiResponseConst = await requestGeminiJson({
    prompt: JSON.stringify(geminiPayloadConst),
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
      },
      required: ['description'],
    },
  });

  const descriptionConst = normalizeText(geminiResponseConst.parsed?.description)
    || buildFallbackDescription(requestDataConst);

  return {
    statusCode: 200,
    source: geminiResponseConst.source,
    reason: geminiResponseConst.reason,
    modelResult: geminiResponseConst.modelResult,
    description: descriptionConst,
  };
};

const suggestEventTags = async ({ organizerEmail, payload = {} }) => {
  const taskDataFromMongoConst = await buildOrganizerContext(organizerEmail);
  const { organizerEventsConst, categoryExamplesConst } = taskDataFromMongoConst;

  const requestDataConst = {
    title: normalizeText(payload.title),
    category: normalizeText(payload.category),
    selectedTags: Array.isArray(payload.selectedTags) ? payload.selectedTags.slice(0, 5) : [],
  };

  if (!requestDataConst.title && !requestDataConst.category) {
    return {
      statusCode: 400,
      error: 'Title or category is required',
    };
  }

  const commonTagsConst = categoryExamplesConst
    .filter(
      (event) =>
        String(event.category || '').toLowerCase() ===
        String(requestDataConst.category || '').toLowerCase(),
    )
    .flatMap((event) => (Array.isArray(event.tags) ? event.tags : []))
    .filter(Boolean)
    .slice(0, 10);

  const geminiPayloadConst = {
    task: 'Suggest event discovery tags for a campus event.',
    organizerRecentEvents: organizerEventsConst,
    commonCategoryTags: commonTagsConst,
    eventDraft: {
      title: requestDataConst.title,
      category: requestDataConst.category,
      selectedTags: requestDataConst.selectedTags,
    },
    rules: [
      'Return up to 5 tags.',
      'Prefer short title-case tags.',
      'Avoid duplicates and avoid tags already selected.',
    ],
  };

  const geminiResponseConst = await requestGeminiJson({
    prompt: JSON.stringify(geminiPayloadConst),
    schema: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['tags'],
    },
  });

  const tagsConst = Array.isArray(geminiResponseConst.parsed?.tags)
    ? geminiResponseConst.parsed.tags.map((tag) => normalizeText(tag)).filter(Boolean)
    : buildFallbackTags(requestDataConst);

  return {
    statusCode: 200,
    source: geminiResponseConst.source,
    reason: geminiResponseConst.reason,
    modelResult: geminiResponseConst.modelResult,
    tags: Array.from(new Set(tagsConst))
      .filter((tag) => !requestDataConst.selectedTags.includes(tag))
      .slice(0, 5),
  };
};

const suggestEventTimes = async ({ organizerEmail, payload = {} }) => {
  const taskDataFromMongoConst = await buildOrganizerContext(organizerEmail);
  const { organizerEventsConst, categoryExamplesConst } = taskDataFromMongoConst;

  const requestDataConst = {
    category: normalizeText(payload.category),
    venue: normalizeText(payload.venue),
    date: normalizeText(payload.date),
  };

  if (!requestDataConst.category) {
    return {
      statusCode: 400,
      error: 'Category is required',
    };
  }

  const categoryTimingExamplesConst = categoryExamplesConst
    .filter(
      (event) =>
        String(event.category || '').toLowerCase() ===
        String(requestDataConst.category || '').toLowerCase(),
    )
    .slice(0, 4)
    .map((event) => ({
      title: clampText(event.title, 40),
      time: event.time,
      venue: event.venue || event.location,
    }));

  const geminiPayloadConst = {
    task: 'Suggest two suitable time slots for a campus event.',
    organizerRecentEvents: organizerEventsConst,
    categoryTimingExamples: categoryTimingExamplesConst,
    eventDraft: requestDataConst,
    rules: [
      'Return exactly two time slot suggestions.',
      'Use 24-hour HH:MM format.',
      'Each slot should include a short practical reason.',
    ],
  };

  const geminiResponseConst = await requestGeminiJson({
    prompt: JSON.stringify(geminiPayloadConst),
    schema: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['startTime', 'endTime', 'reason'],
          },
        },
      },
      required: ['suggestions'],
    },
  });

  const suggestionsConst = Array.isArray(geminiResponseConst.parsed?.suggestions)
    ? geminiResponseConst.parsed.suggestions
        .map((item) => ({
          startTime: normalizeText(item.startTime),
          endTime: normalizeText(item.endTime),
          reason: normalizeText(item.reason),
        }))
        .filter((item) => item.startTime && item.endTime && item.reason)
    : buildFallbackTimeSuggestions(requestDataConst.category);

  return {
    statusCode: 200,
    source: geminiResponseConst.source,
    reason: geminiResponseConst.reason,
    modelResult: geminiResponseConst.modelResult,
    suggestions: suggestionsConst.slice(0, 2),
  };
};

module.exports = {
  generateEventDescription,
  suggestEventTags,
  suggestEventTimes,
};
