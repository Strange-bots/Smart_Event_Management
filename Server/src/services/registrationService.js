const { events } = require('../data/events');
const { registrations } = require('../data/registrations');
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

      return {
        id: registration.id,
        attendeeName: registration.userName,
        attendeeEmail: registration.userEmail,
        eventId: event.id,
        eventName: event.title,
        registrationDate: formatRegistrationDate(registration.registrationDate),
        paymentStatus: registration.paymentStatus,
        attendanceStatus: registration.attendanceStatus,
        riskLevel: calculateAttendanceRisk(registration),
        userRiskLevel: getUserRiskLevel(registration.userEmail),
      };
    });

  return {
    statusCode: 200,
    organizer: sanitizeUser(organizer),
    registrations: organizerRegistrations,
  };
};

const getOrganizerRegistrationDetails = (organizerEmail) =>
  getOrganizerContext(organizerEmail);

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
      !normalizedRiskLevel || registration.riskLevel === normalizedRiskLevel;

    return (
      matchesSearch &&
      matchesEvent &&
      matchesPaymentStatus &&
      matchesRiskLevel
    );
  });
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
      registration.riskLevel,
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
  exportOrganizerRegistrations,
  getOrganizerRegistrationDetails,
  getRegistrationCountForEvent,
  getUserEventRegistrationDetails,
};
