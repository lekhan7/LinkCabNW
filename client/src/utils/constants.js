export const COLORS = {
  primary: '#F5C400',
  primaryDark: '#D4A000',
  secondary: '#FFD700',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLight: '#F8F9FA',
  text: '#000000',
  textSecondary: '#333333',
  textMuted: '#666666',
  error: '#FF4444',
  success: '#28A745',
  warning: '#FFC107',
  info: '#17A2B8',
  border: '#DEE2E6',
};

export const BREAKPOINTS = {
  mobile: '480px',
  tablet: '768px',
  laptop: '1024px',
  desktop: '1200px',
};

export const ANIMATION_DURATION = {
  fast: '0.2s',
  normal: '0.3s',
  slow: '0.5s',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  OTP: '/otp',
  DASHBOARD: '/dashboard',
  ANNOUNCEMENTS: '/announcements',
  CREATE_ANNOUNCEMENT: '/create-announcement',
  CO_PASSENGER_STATUS: '/co-passenger-status',
  PROFILE: '/profile',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
};

export const TRAVEL_MODES = [
  { value: 'car', label: 'Car', icon: 'car' },
  { value: 'auto', label: 'Auto', icon: 'car' },
  { value: 'public', label: 'Public Transport', icon: 'bus' },
];

export const COMFORT_LEVELS = [
  { value: 'basic', label: 'Basic' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'premium', label: 'Premium' },
];

export const SEAT_SHARING_PREFERENCES = [
  { value: 'no-sharing', label: 'No Sharing' },
  { value: 'partial-sharing', label: 'Partial Sharing' },
  { value: 'full-sharing', label: 'Full Sharing' },
];

export const PREFERRED_CO_TRAVELERS = [
  { value: 'any', label: 'Anyone' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'student', label: 'Student' },
  { value: 'professional', label: 'Professional' },
];

export const RIDE_STATUSES = {
  BOOKED: 'booked',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ANNOUNCEMENT_STATUSES = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  EXPIRED: 'expired',
};

export const CONNECTION_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const NOTIFICATION_TYPES = {
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  CONNECTION_REJECTED: 'connection_rejected',
  NEW_MESSAGE: 'new_message',
  TRIP_COMPLETED: 'trip_completed',
  RATING_RECEIVED: 'rating_received',
};
