import { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from './useSimpleAuth';
import { notificationAPI } from '../services/api';

const useCoPassengerNotifications = () => {
  const { user, token } = useSimpleAuth();
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Check if backend is available
  const checkBackendAvailability = useCallback(async () => {
    try {
      // Simple ping to check if backend is responding
      const response = await notificationAPI.getNotifications({ limit: 1 });
      // If we get here, backend is responding (even if empty)
      return true;
    } catch (error) {
      console.log('Backend not available:', error.message);
      return false;
    }
  }, []);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);
      
      // Check if backend is available first
      const isBackendUp = await checkBackendAvailability();
      setBackendAvailable(isBackendUp);
      
      if (!isBackendUp) {
        console.log('Backend not available, using fallback mode');
        setNotifications([]);
        setNotificationCount(0);
        setHasNewNotification(false);
        return;
      }
      
      const response = await notificationAPI.getNotifications({ 
        recipient_id: user.id,
        limit: 50 
      });
      
      const notifications = response.data || []; // Backend returns 'data' not 'notifications'
      setNotifications(notifications);
      const unreadCount = notifications.filter(n => !n.is_read).length;
      setNotificationCount(unreadCount);
      setHasNewNotification(unreadCount > 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setBackendAvailable(false);
      // Graceful fallback - set empty state but don't crash the app
      setNotifications([]);
      setNotificationCount(0);
      setHasNewNotification(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, token, checkBackendAvailability]);

  // Clear all notifications
  const clearNotifications = useCallback(async () => {
    if (!backendAvailable) {
      // Fallback - just update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setNotificationCount(0);
      setHasNewNotification(false);
      return;
    }

    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setNotificationCount(0);
      setHasNewNotification(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setBackendAvailable(false);
      // Fallback - just update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setNotificationCount(0);
      setHasNewNotification(false);
    }
  }, [backendAvailable]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!backendAvailable) {
      // Fallback - just update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      setNotificationCount(prev => Math.max(0, prev - 1));
      setHasNewNotification(false);
      return;
    }

    try {
      await notificationAPI.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      setNotificationCount(prev => Math.max(0, prev - 1));
      setHasNewNotification(false);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setBackendAvailable(false);
      // Fallback - just update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      setNotificationCount(prev => Math.max(0, prev - 1));
      setHasNewNotification(false);
    }
  }, [backendAvailable]);

  // Add new notification (for internal use)
  const addNotification = useCallback((notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || Date.now().toString(),
      created_at: notification.created_at || new Date().toISOString(),
      is_read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setNotificationCount(prev => prev + 1);
    setHasNewNotification(true);
  }, []);

  // Remove notification
  const removeNotification = useCallback(async (notificationId) => {
    if (!backendAvailable) {
      // Fallback - just update local state
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        const unreadCount = updated.filter(n => !n.is_read).length;
        setNotificationCount(unreadCount);
        setHasNewNotification(unreadCount > 0);
        return updated;
      });
      return;
    }

    try {
      await notificationAPI.deleteNotification(notificationId);
      
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        const unreadCount = updated.filter(n => !n.is_read).length;
        setNotificationCount(unreadCount);
        setHasNewNotification(unreadCount > 0);
        return updated;
      });
    } catch (error) {
      console.error('Error removing notification:', error);
      setBackendAvailable(false);
      // Fallback - just update local state
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        const unreadCount = updated.filter(n => !n.is_read).length;
        setNotificationCount(unreadCount);
        setHasNewNotification(unreadCount > 0);
        return updated;
      });
    }
  }, [backendAvailable]);

  // Fetch notifications on component mount and when user changes
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setNotificationCount(0);
      setHasNewNotification(false);
    }
  }, [user?.id, token, fetchNotifications]);

  // Set up polling for new notifications (replace with WebSocket/SSE in production)
  useEffect(() => {
    if (!user || !token) return;

    // Only poll if backend is available
    if (!backendAvailable) {
      // Check backend availability every 30 seconds
      const availabilityCheckInterval = setInterval(() => {
        checkBackendAvailability().then(isAvailable => {
          if (isAvailable) {
            setBackendAvailable(true);
            clearInterval(availabilityCheckInterval);
            fetchNotifications(); // Fetch notifications when backend comes back online
          }
        });
      }, 30000);

      return () => clearInterval(availabilityCheckInterval);
    }

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, token, fetchNotifications, backendAvailable, checkBackendAvailability]);

  return {
    notifications,
    hasNewNotification,
    notificationCount,
    isLoading,
    backendAvailable,
    fetchNotifications,
    clearNotifications,
    markAsRead,
    addNotification,
    removeNotification
  };
};

export default useCoPassengerNotifications;
