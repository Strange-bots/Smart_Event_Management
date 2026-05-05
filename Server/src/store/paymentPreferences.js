const paymentPreferences = [
  {
    id: 'paypref-user-michael-chen',
    userEmail: 'michael.chen@student.koi.edu.au',
    preferredMethod: 'card',
    cardBrand: 'visa',
    cardholderName: 'Michael Chen',
    lastFourDigits: '4421',
    expiryMonth: '09',
    expiryYear: '2028',
    billingPostcode: '2000',
    rememberPreference: true,
    createdAt: '2026-04-10T07:30:00.000Z',
    updatedAt: '2026-05-03T08:10:00.000Z',
  },
  {
    id: 'paypref-user-sarah-johnson',
    userEmail: 'sarah.johnson@student.koi.edu.au',
    preferredMethod: 'card',
    cardBrand: 'mastercard',
    cardholderName: 'Sarah Johnson',
    lastFourDigits: '1188',
    expiryMonth: '11',
    expiryYear: '2027',
    billingPostcode: '2000',
    rememberPreference: true,
    createdAt: '2026-04-07T05:20:00.000Z',
    updatedAt: '2026-05-01T05:25:00.000Z',
  },
];

module.exports = {
  paymentPreferences,
};
