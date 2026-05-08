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
  if (String(recipientGroup || '').startsWith('individual:')) {
    return 'Selected Individual Recipient';
  }

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

const getOrganizerFallbackTemplates = (event, tone, audience, subjectHint = '') => {
  const audienceLabel = getOrganizerAudienceLabel(audience);
  const normalizedSubjectHint = normalizeText(subjectHint);
  const reminderSubject = normalizedSubjectHint || `Reminder: ${event.title} is approaching`;
  const updateSubject = normalizedSubjectHint || `Important Update: ${event.title}`;
  const thankYouSubject = normalizedSubjectHint || `Thank You for Attending ${event.title}`;
  const templates = {
    formal: [
      {
        type: 'Reminder',
        subject: reminderSubject,
        body: `Dear ${audienceLabel},\n\nI am reaching out regarding "${event.title}" to make sure you have the most important details in one place before the event.\n\nEvent details:\n• Date: ${event.dateLabel || event.date}\n• Time: ${event.time}\n• Venue: ${event.venue}\n\nPlease plan to arrive at least 10 minutes early so that check-in can be completed smoothly. If you need to make any arrangements before attending, we recommend doing so ahead of time.\n\nIf you have any questions about the session, attendance, or access, please reply to this message and our team will assist you.\n\nBest regards,\nEvent Organizer`,
      },
      {
        type: 'Update',
        subject: updateSubject,
        body: `Dear ${audienceLabel},\n\nWe are writing to share an important update regarding "${event.title}". Please review the information below carefully so you are aware of the latest arrangements.\n\n[Please add the update details here]\n\nWe recommend checking your registration details and making note of any updated timing, venue, or participation instructions that may affect your attendance.\n\nThank you for your understanding and continued support. If you need clarification, please reply to this email.\n\nSincerely,\nEvent Organizer`,
      },
      {
        type: 'Thank You',
        subject: thankYouSubject,
        body: `Dear ${audienceLabel},\n\nThank you for your involvement with "${event.title}". We sincerely appreciate the time you invested in attending and contributing to the event.\n\nWe hope the session was valuable, well organised, and useful for your academic or professional development. Your participation helps us continue improving future event experiences for the community.\n\nIf feedback is available, we would appreciate hearing your thoughts. We look forward to welcoming you again at future events.\n\nBest regards,\nEvent Organizer`,
      },
    ],
    friendly: [
      {
        type: 'Reminder',
        subject: normalizedSubjectHint || `Don't forget: ${event.title} is coming up!`,
        body: `Hi ${audienceLabel}!\n\nJust a quick note about "${event.title}" so you have everything you need before it starts.\n\nHere’s a reminder:\n• Date: ${event.dateLabel || event.date}\n• Time: ${event.time}\n• Venue: ${event.venue}\n\nPlease try to arrive a little early and keep an eye out for any last-minute event updates. If you need help before the event, reply to this message and we’ll do our best to help.\n\nCheers,\nThe Event Team`,
      },
      {
        type: 'Update',
        subject: normalizedSubjectHint || `Quick update about ${event.title}`,
        body: `Hi ${audienceLabel}!\n\nWe wanted to share an update about "${event.title}" so you know exactly what to expect.\n\n[What's changed]\n\nPlease take a moment to review the update and adjust your plans if needed. We appreciate your flexibility and look forward to seeing you there.\n\nThanks again,\nThe Event Team`,
      },
      {
        type: 'Follow Up',
        subject: normalizedSubjectHint || `Thanks for being part of ${event.title}`,
        body: `Hi ${audienceLabel}!\n\nThanks for being part of "${event.title}". We really appreciate your time and participation.\n\nWe hope you enjoyed the experience, picked up something valuable, and felt welcomed throughout the event. Your involvement helps make these sessions meaningful for everyone.\n\nWe’d love to see you again at future events.\n\nThe Event Team`,
      },
    ],
    short: [
      {
        type: 'Reminder',
        subject: normalizedSubjectHint || `Reminder: ${event.title} - ${event.dateLabel || event.date}`,
        body: `Quick reminder for ${audienceLabel}:\n\n${event.title}\n${event.dateLabel || event.date} at ${event.time}\n${event.venue}\n\nPlease arrive early and reply if you need help before the event.\n\nSee you there!`,
      },
      {
        type: 'Update',
        subject: normalizedSubjectHint || `Update: ${event.title}`,
        body: `Event update for ${audienceLabel}:\n\n${event.title}\n[Change details]\n\nPlease review the update and adjust your plans if needed.\n\nQuestions? Reply to this email.`,
      },
      {
        type: 'Thank You',
        subject: normalizedSubjectHint || `Thanks for joining ${event.title}`,
        body: `Thanks for joining ${event.title}.\n\nWe appreciate your participation, hope the session was useful, and would be glad to see you again at future events.`,
      },
    ],
  };

  return templates[tone] || templates.formal;
};

const getAdminFallbackTemplates = (tone, recipientGroup, subjectHint = '') => {
  const recipientLabel = getAdminRecipientLabel(recipientGroup);
  const normalizedSubjectHint = normalizeText(subjectHint);
  const templates = {
    formal: [
      {
        type: 'Announcement',
        subject: normalizedSubjectHint || 'Important Announcement: Platform Updates',
        body: `Dear ${recipientLabel},\n\nWe are writing to share an important platform communication with you. Please review the following information carefully, as it may affect your use of Smart Events or your participation in campus activities.\n\n[Add announcement details here]\n\nWe encourage you to take note of any required actions, deadlines, or updated procedures mentioned above. If this message affects your account, event participation, or responsibilities on the platform, please act accordingly at your earliest convenience.\n\nThank you for being a valued member of our community.\n\nBest regards,\nSmart Events Administration`,
      },
      {
        type: 'Policy Update',
        subject: normalizedSubjectHint || 'Policy Update: Terms of Service Changes',
        body: `Dear ${recipientLabel},\n\nWe are writing to inform you of an important policy-related update. Please review the summary below and ensure you understand how these changes may apply to your use of the Smart Events platform.\n\nKey changes include:\n• [Change 1]\n• [Change 2]\n• [Change 3]\n\nIf needed, please review the complete policy document at [LINK] and share this information with anyone on your team who may be affected.\n\nSincerely,\nSmart Events Administration`,
      },
      {
        type: 'Reminder',
        subject: normalizedSubjectHint || 'Action Required: Important Platform Notice',
        body: `Dear ${recipientLabel},\n\nThis is a reminder regarding an important item that requires your attention.\n\n[Insert action details]\n\nPlease review the request above and complete any required action within the expected timeframe. If you are unsure how to proceed, contact the platform administration team for clarification.\n\nBest regards,\nSmart Events Administration`,
      },
    ],
    friendly: [
      {
        type: 'Announcement',
        subject: normalizedSubjectHint || 'Exciting News: New Features Just Dropped!',
        body: `Hi ${recipientLabel}!\n\nWe wanted to share an update with you about Smart Events.\n\n[Add announcement details here]\n\nPlease take a moment to read through the details so you know what has changed and whether there is anything you need to do next.\n\nThanks for being part of the community!\n\nThe Smart Events Team`,
      },
      {
        type: 'Support',
        subject: normalizedSubjectHint || "We're Here to Help",
        body: `Hi ${recipientLabel}!\n\nJust checking in to make sure everything is going smoothly on Smart Events.\n\nIf you need help, have questions, or need support with any platform task, please reply to this message and we’ll assist as quickly as possible.\n\nWe’re happy to help.\n\nThe Smart Events Team`,
      },
      {
        type: 'Policy Update',
        subject: normalizedSubjectHint || 'Quick heads up about a policy update',
        body: `Hi ${recipientLabel}!\n\nWe’ve made a few updates and wanted to keep you in the loop.\n\n[Summarize updates]\n\nPlease read through the points above so you understand what has changed and whether it affects your account, events, or participation.\n\nThanks for your time.\n\nThe Smart Events Team`,
      },
    ],
    short: [
      {
        type: 'Announcement',
        subject: normalizedSubjectHint || 'Platform Update',
        body: `Quick update for ${recipientLabel}:\n\n[Brief description]\n\nPlease review the details and complete any required follow-up.\n\nDetails: [LINK]\n\n- Smart Events Team`,
      },
      {
        type: 'Reminder',
        subject: normalizedSubjectHint || 'Important Reminder',
        body: `Reminder for ${recipientLabel}:\n\n[Action details]\n\nPlease review this soon and let us know if you need help.\n\nQuestions? Reply to this email.`,
      },
      {
        type: 'Notice',
        subject: normalizedSubjectHint || 'Service Notice',
        body: `Notice for ${recipientLabel}:\n\n[Brief description]\n\nPlease review the update and keep it for reference if relevant.\n\nMore details: [LINK]`,
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

const generateOrganizerMailTemplates = async ({ organizerEmail, eventId, tone, audience, subjectHint }) => {
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
    subjectIntent: normalizeText(subjectHint),
    recentOrganizerMailSubjects: organizerHistoryConst,
  };

  const geminiResponseConst = await requestGeminiJson({
    prompt: JSON.stringify({
      task: 'Create 3 email templates for an event organizer to contact attendees.',
      context: mongoTaskConst,
      rules: [
        'Return exactly 3 templates.',
        'Each template must have type, subject, and body.',
        'Use the provided subjectIntent as the main communication intent when it is present.',
        'Make each subject closely related to that subjectIntent instead of generic event reminders.',
        'Keep the message practical and specific to the event context.',
        'Write fuller bodies with 3 to 5 short paragraphs or clearly separated sections.',
        'Each body should be noticeably more detailed than a short reminder and include helpful next steps or context.',
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
      : getOrganizerFallbackTemplates(event, tone || 'formal', audience, subjectHint),
    source: templatesConst.length ? geminiResponseConst.source : 'fallback',
    reason: templatesConst.length ? geminiResponseConst.reason : geminiResponseConst.reason || 'invalid_ai_payload',
    modelResult: geminiResponseConst.modelResult,
  };
};

const generateAdminMailTemplates = async ({ adminEmail, tone, recipientGroup, subjectHint }) => {
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
    subjectIntent: normalizeText(subjectHint),
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
        'Use the provided subjectIntent as the main communication intent when it is present.',
        'Make each subject closely related to that subjectIntent instead of generic platform notices.',
        'Keep them suitable for a campus event platform audience.',
        'Write fuller bodies with 3 to 5 short paragraphs or clearly separated sections.',
        'Each body should be noticeably more detailed than a short announcement and include helpful next steps or context.',
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
      : getAdminFallbackTemplates(tone || 'formal', recipientGroup, subjectHint),
    source: templatesConst.length ? geminiResponseConst.source : 'fallback',
    reason: templatesConst.length ? geminiResponseConst.reason : geminiResponseConst.reason || 'invalid_ai_payload',
    modelResult: geminiResponseConst.modelResult,
  };
};

module.exports = {
  generateAdminMailTemplates,
  generateOrganizerMailTemplates,
};
