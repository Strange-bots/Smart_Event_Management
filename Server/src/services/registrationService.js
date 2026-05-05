const { events } = require('../store/events');
const { registrations } = require('../store/registrations');
const { persistCollection } = require('../store/mongoSync');
const { findUserByEmail, sanitizeUser } = require('./authService');
const { getUserRiskLevel } = require('./userHistoryService');

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const normalizeEventId = (eventId) => String(eventId);

const formatRegistrationDate = (dateString) => {
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

const calculateAttendanceRisk = (registration) => {
  if (registration.attendanceStatus === 'no-show') {
    return 'red';
  }

  if (
    registration.paymentStatus === 'unpaid' ||
    registration.attendanceStatus === 'cancelled'
  ) {
    return 'amber';
  }

  return 'green';
};

const getRiskLabel = (riskLevel) => {
  switch (riskLevel) {
    case 'red':
      return 'High Risk';
    case 'amber':
      return 'Medium Risk';
    default:
      return 'Low Risk';
  }
};

const getRiskReason = (riskLevel) => {
  switch (riskLevel) {
    case 'red':
      return 'This attendee has a no-show status, which suggests a higher attendance risk.';
    case 'amber':
      return 'This attendee has an unpaid or cancelled registration that may need attention.';
    default:
      return 'This attendee appears low risk based on current registration and attendance data.';
  }
};

const eventBelongsToOrganizer = (event, organizerEmail) => {
  const normalizedOrganizer = normalizeEmail(organizerEmail);

  return [event.organizerEmail, event.organizerId]
    .filter(Boolean)
    .some((value) => normalizeEmail(value) === normalizedOrganizer);
};

const isActiveRegistration = (registration) =>
  registration.attendanceStatus !== 'cancelled';

const findEventById = (eventId) =>
  events.find((event) => normalizeEventId(event.id) === normalizeEventId(eventId));

const getRegistrationCountForEvent = (eventId) =>
  registrations.filter(
    (registration) =>
      normalizeEventId(registration.eventId) === normalizeEventId(eventId) &&
      isActiveRegistration(registration),
  ).length;

const createRegistrationRecord = async ({
  event,
  user,
  paymentStatus,
  registrationDate = new Date().toISOString().slice(0, 10),
}) => {
  const registration = {
    id: `reg-${event.id}-${Date.now()}`,
    eventId: event.id,
    userName: user.name,
    userEmail: user.email,
    registrationDate,
    paymentStatus,
    attendanceStatus: 'registered',
  };

  if (!Array.isArray(event.attendees)) {
    event.attendees = [];
  }

  event.attendees.push({
    id: registration.id,
    userName: registration.userName,
    userEmail: registration.userEmail,
    registrationDate: registration.registrationDate,
    paymentStatus: registration.paymentStatus,
    attendanceStatus: registration.attendanceStatus,
  });
  registrations.push(registration);
  await persistCollection('events');
  await persistCollection('registrations');

  return registration;
};

const validateRegistrationAvailability = ({ eventId, userEmail }) => {
  const event = findEventById(eventId);

  if (!event) {
    return {
      error: 'Event not found',
      statusCode: 404,
    };
  }

  if (event.status !== 'approved') {
    return {
      error: 'Only approved events can be booked',
      statusCode: 400,
    };
  }

  const existingRegistration = registrations.find(
    (registration) =>
      String(registration.eventId) === String(event.id) &&
      normalizeEmail(registration.userEmail) === normalizeEmail(userEmail) &&
      registration.attendanceStatus !== 'cancelled',
  );

  if (existingRegistration) {
    return {
      error: 'You have already booked this event',
      statusCode: 409,
      registration: existingRegistration,
    };
  }

  const currentRegistrations = getRegistrationCountForEvent(event.id);
  const capacity = Number(event.capacity || 0);

  if (capacity > 0 && currentRegistrations >= capacity) {
    return {
      error: 'This event is already at full capacity',
      statusCode: 409,
    };
  }

  return {
    event,
  };
};

const buildRegisteredEventPayload = (registration, event) => ({
  registrationId: registration.id,
  registrationDate: registration.registrationDate,
  paymentStatus: registration.paymentStatus,
  attendanceStatus: registration.attendanceStatus,
  event: {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location || event.venue,
    venue: event.venue || event.location,
    category: event.category,
    capacity: event.capacity,
    registrations: getRegistrationCountForEvent(event.id),
    image: event.image || event.imagePreview,
    imagePreview: event.imagePreview || event.image,
    isPaid: event.isPaid,
    price: event.price,
    tags: event.tags,
    organizerId: event.organizerId,
    organizerName: event.organizerName,
    organizerEmail: event.organizerEmail,
  },
});

const getUserEventRegistrationDetails = (userEmail) => {
  const normalizedUserEmail = normalizeEmail(userEmail);

  const userEvents = registrations
    .filter(
      (registration) =>
        normalizeEmail(registration.userEmail) === normalizedUserEmail &&
        isActiveRegistration(registration),
    )
    .map((registration) => {
      const event = findEventById(registration.eventId);

      return event ? buildRegisteredEventPayload(registration, event) : null;
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        new Date(left.event.date).getTime() - new Date(right.event.date).getTime(),
    );

  return {
    statusCode: 200,
    registrations: userEvents,
  };
};

const getOrganizerContext = (organizerEmail) => {
  const organizer = findUserByEmail(organizerEmail);

  if (!organizer) {
    return {
      error: 'Organizer account not found',
      statusCode: 404,
    };
  }

  if (organizer.role !== 'organizer') {
    return {
      error: 'Only organizers can access registration details',
      statusCode: 403,
    };
  }

  const organizerEvents = events.filter(
    (event) => eventBelongsToOrganizer(event, organizer.email),
  );

  const organizerEventMap = new Map(
    organizerEvents.map((event) => [normalizeEventId(event.id), event]),
  );

  const organizerRegistrations = registrations
    .filter((registration) =>
      organizerEventMap.has(normalizeEventId(registration.eventId)),
    )
    .map((registration) => {
      const event = organizerEventMap.get(normalizeEventId(registration.eventId));
      const riskLevel = calculateAttendanceRisk(registration);

      return {
        id: registration.id,
        attendeeName: registration.userName,
        attendeeEmail: registration.userEmail,
        eventId: event.id,
        eventName: event.title,
        registrationDate: formatRegistrationDate(registration.registrationDate),
        paymentStatus: registration.paymentStatus,
        attendanceStatus: registration.attendanceStatus,
        risk: {
          level: riskLevel,
          label: getRiskLabel(riskLevel),
          reason: getRiskReason(riskLevel),
        },
        userRiskLevel: getUserRiskLevel(registration.userEmail),
      };
    });

  return {
    statusCode: 200,
    organizer: sanitizeUser(organizer),
    registrations: organizerRegistrations,
  };
};

const filterRegistrations = (registrationsList, filters = {}) => {
  const normalizedSearch =
    typeof filters.search === 'string' ? filters.search.trim().toLowerCase() : '';
  const normalizedEventName =
    typeof filters.eventName === 'string'
      ? filters.eventName.trim().toLowerCase()
      : '';
  const normalizedPaymentStatus =
    typeof filters.paymentStatus === 'string'
      ? filters.paymentStatus.trim().toLowerCase()
      : '';
  const normalizedRiskLevel =
    typeof filters.riskLevel === 'string'
      ? filters.riskLevel.trim().toLowerCase()
      : '';

  return registrationsList.filter((registration) => {
    const matchesSearch =
      !normalizedSearch ||
      `${registration.attendeeName} ${registration.attendeeEmail}`
        .toLowerCase()
        .includes(normalizedSearch);

    const matchesEvent =
      !normalizedEventName ||
      registration.eventName.toLowerCase() === normalizedEventName;

    const matchesPaymentStatus =
      !normalizedPaymentStatus ||
      registration.paymentStatus.toLowerCase() === normalizedPaymentStatus;

    const matchesRiskLevel =
      !normalizedRiskLevel || registration.risk.level === normalizedRiskLevel;

    return (
      matchesSearch &&
      matchesEvent &&
      matchesPaymentStatus &&
      matchesRiskLevel
    );
  });
};

const buildOrganizerRegistrationSummary = (registrationsList) => ({
  total: registrationsList.length,
  paid: registrationsList.filter(
    (registration) => registration.paymentStatus === 'paid',
  ).length,
  unpaid: registrationsList.filter(
    (registration) => registration.paymentStatus === 'unpaid',
  ).length,
  attended: registrationsList.filter(
    (registration) => registration.attendanceStatus === 'attended',
  ).length,
  redList: registrationsList.filter(
    (registration) => registration.risk.level === 'red',
  ).length,
});

const getOrganizerRegistrationDetails = (organizerEmail, filters = {}) => {
  const result = getOrganizerContext(organizerEmail);

  if (result.error) {
    return result;
  }

  const filteredRegistrations = filterRegistrations(
    result.registrations,
    filters,
  );
  const eventOptions = [
    'All Events',
    ...Array.from(
      new Set(result.registrations.map((registration) => registration.eventName)),
    ).sort((left, right) => left.localeCompare(right)),
  ];

  return {
    statusCode: 200,
    organizer: result.organizer,
    registrations: filteredRegistrations,
    summary: buildOrganizerRegistrationSummary(result.registrations),
    eventOptions,
    filters: {
      search: typeof filters.search === 'string' ? filters.search.trim() : '',
      eventName:
        typeof filters.eventName === 'string' && filters.eventName.trim()
          ? filters.eventName.trim()
          : 'All Events',
      paymentStatus:
        typeof filters.paymentStatus === 'string' && filters.paymentStatus.trim()
          ? filters.paymentStatus.trim().toLowerCase()
          : 'all',
      riskLevel:
        typeof filters.riskLevel === 'string' && filters.riskLevel.trim()
          ? filters.riskLevel.trim().toLowerCase()
          : 'all',
    },
  };
};

const escapeXml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildSpreadsheetXml = (rows) => {
  const headerRow = [
    'Attendee Name',
    'Attendee Email',
    'Event Name',
    'Registration Date',
    'Payment Status',
    'Attendance Status',
    'Risk Level',
  ];

  const tableRows = [
    headerRow,
    ...rows.map((registration) => [
      registration.attendeeName,
      registration.attendeeEmail,
      registration.eventName,
      registration.registrationDate,
      registration.paymentStatus,
      registration.attendanceStatus,
      registration.risk.label,
    ]),
  ]
    .map(
      (columns) =>
        `<Row>${columns
          .map(
            (column) =>
              `<Cell><Data ss:Type="String">${escapeXml(column)}</Data></Cell>`
          )
          .join('')}</Row>`
    )
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Registrations">
  <Table>${tableRows}</Table>
 </Worksheet>
</Workbook>`;
};

const exportOrganizerRegistrations = (organizerEmail, filters = {}) => {
  const result = getOrganizerContext(organizerEmail);

  if (result.error) {
    return result;
  }

  const filteredRegistrations = filterRegistrations(
    result.registrations,
    filters,
  );
  const safeEmail = result.organizer.email
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();

  return {
    statusCode: 200,
    organizer: result.organizer,
    registrations: filteredRegistrations,
    fileName: `registrations-${safeEmail}.xls`,
    workbook: buildSpreadsheetXml(filteredRegistrations),
  };
};

module.exports = {
  createRegistrationRecord,
  exportOrganizerRegistrations,
  getOrganizerRegistrationDetails,
  getRegistrationCountForEvent,
  getUserEventRegistrationDetails,
  validateRegistrationAvailability,
};
