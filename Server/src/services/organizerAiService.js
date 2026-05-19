const { readCollection } = require('../database/collections');
const { findUserByEmail } = require('./authService');

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const DEFAULT_GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';
const FALLBACK_GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_FALLBACK_MODEL || 'gemini-2.5-flash-image';

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

const buildFallbackImageDataUrl = ({ title, category, variantIndex = 0 }) => {
  const palettes = [
    { start: '#1F4E79', end: '#163A5A', accent: '#F36F21' },
    { start: '#163A5A', end: '#0F1E33', accent: '#F36F21' },
    { start: '#2E6DA4', end: '#1F4E79', accent: '#FFD166' },
  ];
  const palette = palettes[variantIndex % palettes.length];
  const safeTitle = clampText(title || 'Campus Event', 48);
  const safeCategory = clampText(category || 'Student Experience', 28);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.start}"/>
          <stop offset="100%" stop-color="${palette.end}"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <circle cx="1080" cy="140" r="120" fill="${palette.accent}" fill-opacity="0.22"/>
      <circle cx="200" cy="600" r="180" fill="#FFFFFF" fill-opacity="0.08"/>
      <rect x="88" y="96" width="230" height="44" rx="22" fill="#FFFFFF" fill-opacity="0.14"/>
      <text x="112" y="124" fill="#FFFFFF" font-size="22" font-family="Arial, sans-serif" font-weight="700">${safeCategory}</text>
      <text x="88" y="290" fill="#FFFFFF" font-size="64" font-family="Arial, sans-serif" font-weight="700">${safeTitle}</text>
      <text x="88" y="360" fill="#EAF4FF" font-size="28" font-family="Arial, sans-serif">AI-generated event cover preview</text>
      <rect x="88" y="442" width="280" height="8" rx="4" fill="${palette.accent}"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

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

const extractGeminiImagePart = (responseBody) => {
  const parts = responseBody?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return null;
  }

  return (
    parts.find(
      (part) =>
        part?.inlineData?.data &&
        String(part.inlineData?.mimeType || '').startsWith('image/'),
    ) || null
  );
};

const requestGeminiImageFromModel = async ({ prompt, model }) => {
  if (!process.env.GEMINI_API_KEY) {
    return {
      source: 'fallback',
      reason: 'missing_api_key',
      imageDataUrl: null,
      modelResult: null,
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;

  const imageGenerationConfig =
    model === 'gemini-2.5-flash-image'
      ? {
          responseFormat: {
            image: {
              aspectRatio: '16:9',
            },
          },
        }
      : {
          responseFormat: {
            image: {
              aspectRatio: '16:9',
              imageSize: '2K',
            },
          },
        };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY,
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
          temperature: 0.8,
          ...imageGenerationConfig,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        source: 'fallback',
        reason: 'gemini_request_failed',
        imageDataUrl: null,
        modelResult: `Gemini image request failed for ${model} (${response.status}): ${errorText}`,
      };
    }

    const responseBody = await response.json();
    const imagePart = extractGeminiImagePart(responseBody);

    if (!imagePart?.inlineData?.data || !imagePart?.inlineData?.mimeType) {
      return {
        source: 'fallback',
        reason: 'invalid_ai_payload',
        imageDataUrl: null,
        modelResult: `${model}: ${extractGeminiText(responseBody) || 'No image part returned'}`,
      };
    }

    return {
      source: 'gemini',
      reason: null,
      imageDataUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      modelResult: `${model}: ${extractGeminiText(responseBody) || 'image_generated'}`,
    };
  } catch (error) {
    return {
      source: 'fallback',
      reason: 'gemini_request_failed',
      imageDataUrl: null,
      modelResult: `${model}: ${error?.message || 'Unknown Gemini image error'}`,
    };
  }
};

const requestGeminiImage = async ({ prompt }) => {
  const modelsToTry = Array.from(
    new Set([DEFAULT_GEMINI_IMAGE_MODEL, FALLBACK_GEMINI_IMAGE_MODEL].filter(Boolean)),
  );
  const failedResults = [];

  for (const model of modelsToTry) {
    const result = await requestGeminiImageFromModel({ prompt, model });

    if (result.imageDataUrl) {
      return result;
    }

    failedResults.push(result.modelResult || `${model}: unknown_error`);
  }

  return {
    source: 'fallback',
    reason: 'gemini_request_failed',
    imageDataUrl: null,
    modelResult: failedResults.join(' | '),
  };
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

const generateEventImages = async ({ organizerEmail, payload = {} }) => {
  const taskDataFromMongoConst = await buildOrganizerContext(organizerEmail);
  const { organizerEventsConst } = taskDataFromMongoConst;

  const requestDataConst = {
    title: normalizeText(payload.title),
    description: clampText(payload.description, 400),
    category: normalizeText(payload.category),
    venue: normalizeText(payload.venue),
    date: normalizeText(payload.date),
    isPaid: Boolean(payload.isPaid),
    tags: Array.isArray(payload.tags) ? payload.tags.map((tag) => normalizeText(tag)).filter(Boolean).slice(0, 5) : [],
    limit: Math.min(Math.max(Number(payload.limit || 3), 1), 4),
  };

  if (!requestDataConst.title || !requestDataConst.description) {
    return {
      statusCode: 400,
      error: 'Event title and description are required',
    };
  }

  const variantPrompts = [
    'Create a polished campus event cover image with a realistic, welcoming atmosphere, featuring several students or attendees actively participating in the event.',
    'Create a more energetic alternative with stronger motion, crowd energy, visible human interaction, and dynamic event activity.',
    'Create a cleaner professional variation suitable for an academic promotion banner, with people engaged in a focused workshop, seminar, or networking moment.',
    'Create a warm community-focused alternative with a strong student-life feeling, showing friendly people, social connection, and event-related props.',
  ].slice(0, requestDataConst.limit);

  const images = [];
  const failures = [];

  for (let index = 0; index < variantPrompts.length; index += 1) {
    const variantPrompt = variantPrompts[index];
    const prompt = [
      'Generate a high-quality, visually appealing event cover image.',
      'Do not include any text, letters, logos, watermarks, UI, borders, or collages.',
      'Use a 16:9 composition suitable for a campus event card or hero image.',
      'Keep the scene appropriate for a university event promotion.',
      'The image should feel like a real event moment, not a plain abstract background.',
      'Include human subjects whenever appropriate, such as students, speakers, attendees, presenters, or small groups interacting naturally.',
      'Show visual elements that represent the event theme, such as laptops, presentation screens, workshop tables, microphones, discussion circles, notebooks, sports equipment, cultural decor, or networking interactions when relevant.',
      'Use cinematic but realistic lighting, clear focal points, layered foreground and background depth, and a composition that reads well as a promotional banner.',
      'Avoid uncanny faces, extra fingers, distorted anatomy, cluttered scenes, and empty spaces with no subject.',
      'Prefer a modern university or event environment with believable activity and strong visual storytelling.',
      variantPrompt,
      `Event title: ${requestDataConst.title}`,
      `Event category: ${requestDataConst.category || 'Campus event'}`,
      `Event venue: ${requestDataConst.venue || 'Campus venue'}`,
      `Event date: ${requestDataConst.date || 'Upcoming event'}`,
      `Event details: ${requestDataConst.description}`,
      requestDataConst.tags.length ? `Relevant themes: ${requestDataConst.tags.join(', ')}` : null,
      requestDataConst.isPaid
        ? 'The scene can feel premium, polished, and high-value because this is a paid event.'
        : 'The scene should feel open, engaging, and accessible because this is a free event.',
      organizerEventsConst.length
        ? `Organizer event history themes: ${organizerEventsConst
            .flatMap((event) => event.tags || [])
            .filter(Boolean)
            .slice(0, 8)
            .join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    const generatedImage = await requestGeminiImage({ prompt });

    if (generatedImage.imageDataUrl) {
      images.push({
        id: `gemini-image-${index + 1}`,
        label: `Option ${index + 1}`,
        imageDataUrl: generatedImage.imageDataUrl,
        mimeType:
          generatedImage.imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] ||
          'image/png',
        modelResult: generatedImage.modelResult || null,
      });
      continue;
    }

    failures.push(generatedImage.reason || 'unknown_error');
  }

  if (!images.length) {
    const fallbackImages = Array.from({ length: requestDataConst.limit }, (_, index) => ({
      id: `fallback-image-${index + 1}`,
      label: `Option ${index + 1}`,
      imageDataUrl: buildFallbackImageDataUrl({
        title: requestDataConst.title,
        category: requestDataConst.category,
        variantIndex: index,
      }),
      mimeType: 'image/svg+xml',
    }));

    return {
      statusCode: 200,
      source: 'fallback',
      reason: failures[0] || 'gemini_request_failed',
      modelResult: failures.join(', ') || null,
      images: fallbackImages,
    };
  }

  return {
    statusCode: 200,
    source: 'gemini',
    reason: failures.length ? 'partial_generation_failure' : null,
    modelResult: failures.join(', ') || null,
    images,
  };
};

module.exports = {
  generateEventDescription,
  generateEventImages,
  suggestEventTags,
  suggestEventTimes,
};
