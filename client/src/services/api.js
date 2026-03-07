import axios from 'axios';
import { config } from '../config/env.js';

const API_BASE_URL = config.apiBaseUrl;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds for better mobile hotspot compatibility
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      return Promise.reject({
        status,
        ...(typeof data === 'object' && data !== null ? data : {}),
        message: (typeof data === 'object' && data !== null && data.message) ? data.message : (data || error.message)
      });
    }
    // Enhanced network error handling for mobile hotspots
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({ 
        status: undefined, 
        message: 'Connection timeout. Please check your network connection and try again.',
        isNetworkError: true
      });
    }
    return Promise.reject({ status: undefined, message: error.message || 'Network error' });
  }
);

// Auth API
export const authAPI = {
  signup: (userData) => {
    // Check if userData is FormData (for file upload)
    if (userData instanceof FormData) {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      return api.post('/auth/signup', userData, config);
    }
    return api.post('/auth/signup', userData);
  },
  login: (credentials) => api.post('/auth/login', credentials),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  getCurrentOTP: (phoneNumber) => api.get('/auth/current-otp', { params: { phoneNumber } }),
  getProfile: () => api.get('/auth/profile'),
};

// User API
export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  updateProfilePhoto: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.put('/users/profile-photo', formData, config);
  },
  getUserStats: () => api.get('/users/stats'),
  searchUsers: (query) => api.get('/users/search', { params: query }),
  getUserReviews: (userId) => api.get(`/users/${userId}/reviews`),
  getUserById: (userId) => api.get(`/users/${userId}`),
  getUserConnections: () => api.get('/users/connections'),
  getPendingRequests: () => api.get('/users/pending-requests'),
  respondToConnectionRequest: (requestId, action) => api.put(`/users/connections/${requestId}/${action}`),
  removeCoPassenger: (coPassengerId) => api.delete(`/users/connections/${coPassengerId}`),
};

// Announcement API
export const announcementAPI = {
  getAllAnnouncements: (params) => api.get('/announcements', { params }),
  getAnnouncementById: (id) => api.get(`/announcements/${id}`),
  createAnnouncement: (data) => api.post('/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
  getMyAnnouncements: (params) => api.get('/announcements/my', { params }),
  getGoingRides: (params) => api.get('/announcements/going', { params }),
  respondToJoinRequest: (announcementId, requesterId, data) => api.put(`/announcements/${announcementId}/respond/${requesterId}`, data),
  joinAnnouncement: (id, data) => api.post(`/announcements/${id}/join`, data),
  getAnnouncementParticipants: (id) => api.get(`/announcements/${id}/participants`),
  searchAnnouncements: (params) => api.get('/announcements/search', { params }),
  getPopularAnnouncements: (params) => api.get('/announcements/popular', { params }),
  getRecentAnnouncements: (params) => api.get('/announcements/recent', { params }),
  createJoinRequest: (announcementId) => api.post(`/announcements/${announcementId}/join`),
  acceptJoinRequest: (announcementId, requestId) => api.put(`/announcements/${announcementId}/accept/${requestId}`),
  rejectJoinRequest: (announcementId, requestId) => api.put(`/announcements/${announcementId}/reject/${requestId}`),
  completeRide: (announcementId) => api.put(`/announcements/${announcementId}/complete`),
  finishRide: (announcementId) => api.put(`/announcements/${announcementId}/finish`),
};

// Chat API
export const chatAPI = {
  joinChat: (announcementId) => api.post('/chat/join', { announcementId }),
  getChats: () => api.get('/chat'),
  getChatMessages: (chatId) => api.get(`/chat/${chatId}/messages`),
  sendMessage: (chatId, data) => api.post(`/chat/${chatId}/messages`, data),
};

// Payment API
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
  getPaymentDetails: (paymentId) => api.get(`/payments/${paymentId}`),
};

// Notification API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  actionNotification: (notificationId, data) => api.post(`/notifications/${notificationId}/action`, data),
};

// Review API
export const reviewAPI = {
  createReview: (data) => api.post('/reviews', data),
  getMyRideReviews: (rideId) => api.get(`/reviews/ride/${rideId}/my`),
  submitReview: (data) => api.post('/reviews/submit', data),
  getReviewableUsers: (announcementId) => api.get(`/reviews/${announcementId}/reviewable-users`),
  getMyReviews: () => api.get('/reviews/my-reviews'),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`),
  getRideReviews: (rideId) => api.get(`/reviews/ride/${rideId}`),
};

// Report API
export const reportAPI = {
  submit: (data) => api.post('/reports/submit', data),
  getReasons: () => api.get('/reports/reasons'),
  getMyReports: () => api.get('/reports/my-reports'),
  getReportsAgainstMe: () => api.get('/reports/reports-against-me'),
  getAdminReports: () => api.get('/reports/admin'),
  updateReportStatus: (reportId, data) => api.put(`/reports/${reportId}/status`, data),
};

// User Analytics API
export const userAnalyticsAPI = {
  getRatingAnalytics: (userId) => {
    const url = userId ? `/user-analytics/ratings/${userId}` : '/user-analytics/ratings';
    return api.get(url);
  },
  getUserReviews: (userId, params) => {
    const url = userId ? `/user-analytics/reviews/${userId}` : '/user-analytics/reviews';
    return api.get(url, { params });
  },
  getCompletedRides: (userId, params) => {
    const url = userId ? `/user-analytics/completed-rides/${userId}` : '/user-analytics/completed-rides';
    return api.get(url, { params });
  },
  getPlatformAnalytics: () => api.get('/user-analytics/platform'),
};

// Rating API
export const ratingAPI = {
  createRating: (data) => api.post('/ratings', data),
  getMyRatings: (params) => api.get('/ratings/my', { params }),
  getUserRatings: (userId, params) => api.get(`/ratings/user/${userId}`, { params }),
  getRatingStats: () => api.get('/ratings/stats'),
};

// Analytics API
export const analyticsAPI = {
  getAnalytics: () => api.get('/analytics'),
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getReviews: () => api.get('/analytics/reviews'),
};

// Recent Activities API
export const recentActivitiesAPI = {
  getRecentActivities: () => api.get('/recent-activities'),
};

// Favorites API
export const favoritesAPI = {
  addToFavorites: (data) => api.post('/favorites', data),
  removeFromFavorites: (announcementId) => api.delete(`/favorites/${announcementId}`),
  getUserFavorites: () => api.get('/favorites'),
  checkFavoriteStatus: (announcementId) => api.get(`/favorites/check/${announcementId}`),
  goRide: (announcementId) => api.post(`/favorites/go-ride/${announcementId}`),
};

// Ride Completion API
export const rideCompletionAPI = {
  completeRide: (announcementId, data) => api.post(`/ride-completion/${announcementId}/complete`, data),
  getCompletionStatus: (announcementId) => api.get(`/ride-completion/${announcementId}/completion-status`),
  getCompletionEvents: (announcementId) => api.get(`/ride-completion/${announcementId}/completion-events`),
};

// Export all services as a single object for easier importing
export const authService = authAPI;
export const userService = userAPI;
export const announcementService = announcementAPI;
export const chatService = chatAPI;
export const paymentService = paymentAPI;
export const notificationService = notificationAPI;
export const ratingService = ratingAPI;
export const analyticsService = analyticsAPI;
export const favoritesService = favoritesAPI;
export const reviewService = reviewAPI;
export const reportService = reportAPI;
export const userAnalyticsService = userAnalyticsAPI;
export const rideCompletionService = rideCompletionAPI;

export default api;
