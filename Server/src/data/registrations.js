const registrations = [
  {
    id: 'reg-102-1',
    eventId: 102,
    userName: 'Sophia Chen',
    userEmail: 'sophia@example.com',
    registrationDate: '2026-04-02',
    paymentStatus: 'paid',
    attendanceStatus: 'registered',
  },
  {
    id: 'reg-102-2',
    eventId: 102,
    userName: 'Liam Patel',
    userEmail: 'liam@example.com',
    registrationDate: '2026-04-03',
    paymentStatus: 'unpaid',
    attendanceStatus: 'no-show',
  },
  {
    id: 'reg-104-1',
    eventId: 104,
    userName: 'Olivia Brown',
    userEmail: 'olivia@example.com',
    registrationDate: '2026-04-04',
    paymentStatus: 'paid',
    attendanceStatus: 'attended',
  },
  {
    id: 'reg-104-2',
    eventId: 104,
    userName: 'Noah Singh',
    userEmail: 'noah@example.com',
    registrationDate: '2026-04-05',
    paymentStatus: 'refunded',
    attendanceStatus: 'cancelled',
  },
];

module.exports = {
  registrations,
};
