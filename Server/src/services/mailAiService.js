const { readCollection } = require('../database/collections');
const { findUserByEmail, listUsers } = require('./authService');

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

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
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
          maxOutputTokens: 700,
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

const getOrganizerAudienceLabel = (audience) => {
  switch (audience) {
    case 'all':
      return 'All Registrants';
    case 'paid':
      return 'Paid Attendees';
    case 'cancelled':
      return 'Cancelled Registrants';
    case 'attended':
      return 'Attended Participants';
    case 'no-show':
      return 'No-Show Attendees';
    default:
      return audience || 'Selected Audience';
  }
};

const getAdminRecipientLabel = (recipientGroup) => {
  switch (recipientGroup) {
    case 'all-users':
      return 'All Users';
    case 'all-organizers':
      return 'All Organizers';
    case 'all':
      return 'Everyone';
    default:
      return recipientGroup || 'Selected Recipients';
  }
};

const getOrganizerFallbackTemplates = (event, tone, audience) => {
  const audienceLabel = getOrganizerAudienceLabel(audience);
  const templates = {
    formal: [
      {
        type: 'Reminder',
        subject: `Reminder: ${event.title} is approaching`,
        body: `Dear ${audienceLabel},\n\nThis is a courteous reminder that "${event.title}" is scheduled for ${event.dateLabel || event.date} at ${event.time}.\n\nVenue: ${event.venue}\n\nPlease arrive 10 minutes early.\n\nBest regards,\nEvent Organizer`,
      },
      {
        type: 'Update',
        subject: `Important Update: ${event.title}`,
        body: `Dear ${audienceLabel},\n\nWe are writing to share an important update regarding "${event.title}".\n\n[Please add the update details here]\n\nThank you for your understanding.\n\nSincerely,\nEvent Organizer`,
      },
      {
        type: 'Thank You',
        subject: `Thank You for Attending ${event.title}`,
        body: `Dear ${audienceLabel},\n\nThank you for your involvement with "${event.title}". We appreciate your participation and hope you found the session valuable.\n\nBest regards,\nEvent Organizer`,
      },
    ],
    friendly: [
      {
        type: 'Reminder',
        subject: `Don't forget: ${event.title} is coming up!`,
        body: `Hi ${audienceLabel}!\n\nJust a quick reminder that "${event.title}" is happening on ${event.dateLabel || event.date} at ${event.time}.\n\nWe’ll see you at ${event.venue}.\n\nCheers,\nThe Event Team`,
      },
      {
        type: 'Update',
        subject: `Quick update about ${event.title}`,
        body: `Hi ${audienceLabel}!\n\nWe wanted to share a quick update about "${event.title}".\n\n[What's changed]\n\nThanks for your understanding.\n\nThe Event Team`,
      },
      {
        type: 'Follow Up',
        subject: `Thanks for being part of ${event.title}`,
        body: `Hi ${audienceLabel}!\n\nThanks for being part of "${event.title}". We hope you enjoyed the experience and look forward to seeing you again.\n\nThe Event Team`,
      },
    ],
    short: [
      {
        type: 'Reminder',
        subject: `Reminder: ${event.title} - ${event.dateLabel || event.date}`,
        body: `Quick reminder for ${audienceLabel}:\n\n${event.title}\n${event.dateLabel || event.date} at ${event.time}\n${event.venue}\n\nSee you there!`,
      },
      {
        type: 'Update',
        subject: `Update: ${event.title}`,
        body: `Event update for ${audienceLabel}:\n\n${event.title}\n[Change details]\n\nQuestions? Reply to this email.`,
      },
      {
        type: 'Thank You',
        subject: `Thanks for joining ${event.title}`,
        body: `Thanks for joining ${event.title}.\n\nWe appreciate your participation and hope to see you again soon.`,
      },
    ],
  };

  return templates[tone] || templates.formal;
};

const getAdminFallbackTemplates = (tone, recipientGroup) => {
  const recipientLabel = getAdminRecipientLabel(recipientGroup);
  const templates = {
    formal: [
      {
        type: 'Announcement',
        subject: 'Important Announcement: Platform Updates',
        body: `Dear ${recipientLabel},\n\nWe are pleased to announce important updates to the Smart Events platform that will enhance your experience.\n\n[Add announcement details here]\n\nThank you for being a valued member of our community.\n\nBest regards,\nSmart Events Administration`,
      },
      {
        type: 'Policy Update',
        subject: 'Policy Update: Terms of Service Changes',
        body: `Dear ${recipientLabel},\n\nWe are writing to inform you of updates to our Terms of Service and Privacy Policy, effective [DATE].\n\nKey changes include:\n• [Change 1]\n• [Change 2]\n• [Change 3]\n\nPlease review the full policy at [LINK].\n\nSincerely,\nSmart Events Administration`,
      },
      {
        type: 'Reminder',
        subject: 'Action Required: Important Platform Notice',
        body: `Dear ${recipientLabel},\n\nThis is a reminder regarding an important item that requires your attention.\n\n[Insert action details]\n\nBest regards,\nSmart Events Administration`,
      },
    ],
    friendly: [
      {
        type: 'Announcement',
        subject: 'Exciting News: New Features Just Dropped!',
        body: `Hi ${recipientLabel}!\n\nWe’ve rolled out some useful updates to make your Smart Events experience even better.\n\n[Add announcement details here]\n\nThanks for being part of the community!\n\nThe Smart Events Team`,
      },
      {
        type: 'Support',
        subject: "We're Here to Help",
        body: `Hi ${recipientLabel}!\n\nJust checking in to make sure everything is going smoothly on Smart Events.\n\nIf you need help, reply to this email and we’ll assist.\n\nThe Smart Events Team`,
      },
      {
        type: 'Policy Update',
        subject: 'Quick heads up about a policy update',
        body: `Hi ${recipientLabel}!\n\nWe’ve made a few policy updates and wanted to keep you in the loop.\n\n[Summarize updates]\n\nThanks for your time.\n\nThe Smart Events Team`,
      },
    ],
    short: [
      {
        type: 'Announcement',
        subject: 'Platform Update',
        body: `Quick update for ${recipientLabel}:\n\n[Brief description]\n\nDetails: [LINK]\n\n- Smart Events Team`,
      },
      {
        type: 'Reminder',
        subject: 'Important Reminder',
        body: `Reminder for ${recipientLabel}:\n\n[Action details]\n\nQuestions? Reply to this email.`,
      },
      {
        type: 'Notice',
        subject: 'Service Notice',
        body: `Notice for ${recipientLabel}:\n\n[Brief description]\n\nMore details: [LINK]`,
      },
    ],
  };

  return templates[tone] || templates.formal;
};

const normalizeTemplates = (templates) =>
  Array.isArray(templates)
    ? templates
        .map((template) => ({
          type: normalizeText(template?.type),
          subject: normalizeText(template?.subject),
          body: String(template?.body || '').trim(),
        }))
        .filter((template) => template.type && template.subject && template.body)
        .slice(0, 3)
    : [];

const generateOrganizerMailTemplates = async ({ organizerEmail, eventId, tone, audience }) => {
  const [organizer, events, emailLogs] = await Promise.all([
    findUserByEmail(organizerEmail),
    readCollection('events'),
    readCollection('emailLogs'),
  ]);

  if (!organizer || organizer.role !== 'organizer') {
    return {
      error: 'Organizer account not found',
      statusCode: organizer ? 403 : 404,
    };
  }

  const event = events.find(
    (item) =>
      String(item.id) === String(eventId) &&
      String(item.organizerEmail || '').toLowerCase() === String(organizer.email).toLowerCase(),
  );

  if (!event) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  const organizerHistoryConst = emailLogs
    .filter((log) => String(log.organizerEmail || log.senderEmail || '').toLowerCase() === String(organizer.email).toLowerCase())
    .slice(0, 5)
    .map((log) => ({
      subject: log.subject,
      audience: log.audience || log.recipient,
    }));

  const mongoTaskConst = {
    organizer: {
      name: organizer.name,
      department: organizer.department || null,
    },
    event: {
      title: event.title,
      date: event.dateLabel || event.date,
      time: event.time,
      venue: event.venue || event.location,
      category: event.category,
      registrations: Number(event.registrations || 0),
    },
    audience: getOrganizerAudienceLabel(audience),
    tone: tone || 'formal',
    recentOrganizerMailSubjects: organizerHistoryConst,
  };

  const geminiResponseConst = await requestGeminiJson({
    prompt: JSON.stringify({
      task: 'Create 3 email templates for an event organizer to contact attendees.',
      context: mongoTaskConst,
      rules: [
        'Return exactly 3 templates.',
        'Each template must have type, subject, and body.',
        'Keep the message practical and specific to the event context.',
        'Do not use markdown.',
      ],
    }),
    schema: {
      type: 'object',
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              subject: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['type', 'subject', 'body'],
          },
        },
      },
      required: ['templates'],
    },
  });

  const templatesConst = normalizeTemplates(geminiResponseConst.parsed?.templates);

  return {
    statusCode: 200,
    templates: templatesConst.length
      ? templatesConst
      : getOrganizerFallbackTemplates(event, tone || 'formal', audience),
    source: templatesConst.length ? geminiResponseConst.source : 'fallback',
    reason: templatesConst.length ? geminiResponseConst.reason : geminiResponseConst.reason || 'invalid_ai_payload',
    modelResult: geminiResponseConst.modelResult,
  };
};

const generateAdminMailTemplates = async ({ adminEmail, tone, recipientGroup }) => {
  const [admin, users, emailLogs] = await Promise.all([
    findUserByEmail(adminEmail),
    listUsers(),
    readCollection('emailLogs'),
  ]);

  if (!admin || admin.role !== 'admin') {
    return {
      error: 'Admin account not found',
      statusCode: admin ? 403 : 404,
    };
  }

  const mongoTaskConst = {
    admin: {
      name: admin.name,
    },
    recipientGroup: getAdminRecipientLabel(recipientGroup),
    tone: tone || 'formal',
    counts: {
      users: users.filter((user) => user.role === 'user').length,
      organizers: users.filter((user) => user.role === 'organizer').length,
    },
    recentMailSubjects: emailLogs
      .filter((log) => String(log.senderEmail || '').toLowerCase() === String(admin.email).toLowerCase())
      .slice(0, 5)
      .map((log) => ({
        subject: log.subject,
        recipient: log.recipient || log.recipientGroup,
      })),
  };

  const geminiResponseConst = await requestGeminiJson({
    prompt: JSON.stringify({
      task: 'Create 3 email templates for a platform admin.',
      context: mongoTaskConst,
      rules: [
        'Return exactly 3 templates.',
        'Each template must have type, subject, and body.',
        'Keep them suitable for a campus event platform audience.',
        'Do not use markdown.',
      ],
    }),
    schema: {
      type: 'object',
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              subject: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['type', 'subject', 'body'],
          },
        },
      },
      required: ['templates'],
    },
  });

  const templatesConst = normalizeTemplates(geminiResponseConst.parsed?.templates);

  return {
    statusCode: 200,
    templates: templatesConst.length
      ? templatesConst
      : getAdminFallbackTemplates(tone || 'formal', recipientGroup),
    source: templatesConst.length ? geminiResponseConst.source : 'fallback',
    reason: templatesConst.length ? geminiResponseConst.reason : geminiResponseConst.reason || 'invalid_ai_payload',
    modelResult: geminiResponseConst.modelResult,
  };
};

module.exports = {
  generateAdminMailTemplates,
  generateOrganizerMailTemplates,
};
