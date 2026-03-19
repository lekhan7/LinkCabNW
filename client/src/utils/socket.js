// ============================================
// 🔥 SIMPLE SOCKET.IO CLIENT SETUP
// ============================================

import { io } from 'socket.io-client';

// Create socket instance with proper authentication
const createSocket = (token) => {
  // Use production backend URL
  const backendUrl = 'https://linkcab-0t9d.onrender.com';
  
  return io(backendUrl, {
    auth: {
      token: token
    },
    forceNew: true,
    transports: ['websocket', 'polling'] // Ensure proper connection
  });
};

let socket = null;

// Initialize socket with token
export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }
  socket = createSocket(token);
  return socket;
};

// Global notification handlers
window.socketHandlers = {
  onNotification: null,
  onAnnouncementUpdate: null
};

// Connection events
if (socket) {
  socket.on('connect', () => {
    console.log('✅ Connected to Socket.IO server');
    
    // Join user room
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) {
      socket.emit('join-user-room', user.id);
      console.log(`👤 Joined user room: ${user.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from Socket.IO server');
  });

  // Notification events
  socket.on('notification', (data) => {
    console.log('🔔 Received notification:', data);
    
    // Show toast notification
    if (window.showToast) {
      const messageType = data.type === 'join_accepted' ? 'success' : 'error';
      window.showToast(data.message, messageType);
    }
    
    // Call custom handler if set
    if (window.socketHandlers.onNotification) {
      window.socketHandlers.onNotification(data);
    }
    
    // Refresh notification bar if it exists
    if (window.refreshNotifications) {
      window.refreshNotifications();
    }
  });

  socket.on('announcement-updated', (data) => {
    console.log('📡 Received announcement update:', data);
    
    // Call custom handler if set
    if (window.socketHandlers.onAnnouncementUpdate) {
      window.socketHandlers.onAnnouncementUpdate(data);
    }
    
    // Refresh UI components
    if (window.refreshMyAnnouncements) {
      window.refreshMyAnnouncements();
    }
    
    if (window.refreshCoPassengerManager) {
      window.refreshCoPassengerManager();
    }
  });
}

// Helper functions
export const reconnectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }
  socket = createSocket(token);
  console.log('🔄 Socket reconnected with new token');
  return socket;
};

export const joinAnnouncementRoom = (announcementId) => {
  if (socket) {
    socket.emit('join-announcement-room', announcementId);
    console.log(`📢 Joined announcement room: ${announcementId}`);
  }
};

export const setNotificationHandler = (handler) => {
  window.socketHandlers.onNotification = handler;
};

export const setAnnouncementUpdateHandler = (handler) => {
  window.socketHandlers.onAnnouncementUpdate = handler;
};

export default socket;
