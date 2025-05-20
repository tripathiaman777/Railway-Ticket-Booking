export const BERTH_TYPES = {
  LOWER: 'LOWER',
  MIDDLE: 'MIDDLE',
  UPPER: 'UPPER',
  SIDE_LOWER: 'SIDE_LOWER',
  SIDE_UPPER: 'SIDE_UPPER'
};

export const BERTH_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  RAC: 'RAC'
};

export const TICKET_STATUS = {
  CONFIRMED: 'CONFIRMED',
  RAC: 'RAC',
  WAITING_LIST: 'WAITING_LIST',
  CANCELLED: 'CANCELLED'
};

export const PASSENGER_STATUS = {
  CONFIRMED: 'CONFIRMED',
  RAC: 'RAC',
  WAITING_LIST: 'WAITING_LIST',
  NO_BERTH: 'NO_BERTH'
};

export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER'
};

export const LIMITS = {
  CONFIRMED_BERTHS: 63,
  RAC_BERTHS: 9,
  RAC_PASSENGERS: 18, // 2 passengers per RAC berth
  WAITING_LIST: 10,
  CHILD_AGE: 5,  // Children under 5 don't get a berth
  SENIOR_AGE: 60 // Seniors get priority for lower berths
};

export const generatePNR = () => {
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `PNR${timestamp}${random}`;
};