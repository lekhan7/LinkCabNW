import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../utils/constants';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { useToast } from '../hooks/useToast';
import { FaBell, FaUserFriends, FaComment, FaStar, FaCheckCircle, FaTimes, FaExternalLinkAlt, FaClock, FaWhatsapp } from 'react-icons/fa';
import { notificationAPI, announcementAPI } from '../services/api';

const Notifications = () => {
  const { user } = useSimpleAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch real notifications from database
      const response = await notificationAPI.getNotifications({ 
        limit: 50 
      });
      
      const notifications = response.data || [];
      setNotifications(notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      
      // Check if it's a network/backend unavailable error
      if (err.message === 'Network error' || err.status === undefined) {
        error('Backend unavailable - please try again in a few minutes');
      } else if (err.status === 500) {
        error('Server error - please try again later');
      } else {
        error('Failed to fetch notifications');
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      // Handle different notification types based on new specification
      if (notification.type === 'FAVORITE_ROUTE_MATCH' && notification.announcement_id) {
        // Navigate to announcement page
        navigate(`/announcement/${notification.announcement_id}`);
      } else if (notification.type === 'join_accepted' && notification.related_user_phone) {
        // Open WhatsApp with creator's phone number
        const whatsappUrl = `https://wa.me/${notification.related_user_phone.replace('+', '')}?text=Hi, my request was accepted for the ride.`;
        window.open(whatsappUrl, '_blank');
      } else if (notification.type === 'join_rejected') {
        // Just mark as read - no special action needed
        return;
      } else if (notification.type === 'join_request') {
        // Navigate to announcement to manage co-passengers
        navigate(`/announcement/${notification.announcement_id}`);
      } else if (notification.announcement_id) {
        // For other announcement-related notifications, navigate to announcement details
        navigate(`/announcement/${notification.announcement_id}`);
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Mark notification as read in database
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true, read_at: new Date().toISOString() } : notif
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleConnectionRequest = async (notificationId, action) => {
    try {
      // Find the notification to get request details
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification || !notification.request_id || !notification.announcement_id) {
        error('Invalid notification data');
        return;
      }

      // Update connection request status in database
      await announcementAPI.respondToJoinRequest(
        notification.announcement_id,
        notification.request_id,
        { action }
      );
      
      // Mark notification as read
      await notificationAPI.markAsRead(notificationId);
      
      // Refresh notifications
      fetchNotifications();
      
      success(`Connection request ${action}ed successfully`);
    } catch (err) {
      console.error('Error handling connection request:', err);
      if (err.status === 500) {
        error('Server error - please try again later');
      } else {
        error(`Failed to ${action} connection request`);
      }
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Delete notification from database
      await notificationAPI.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      success('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
      if (err.status === 500) {
        error('Server error - please try again later');
      } else {
        error('Failed to delete notification');
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read in database
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
      
      success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      if (err.status === 500) {
        error('Server error - please try again later');
      } else {
        error('Failed to mark all notifications as read');
      }
    }
  };

  const getNotificationIcon = (type, status) => {
    switch (type) {
      case 'join_request':
        return <FaUserFriends style={{ color: status === 'pending' ? COLORS.info : COLORS.secondary }} />;
      case 'join_accepted':
        return <FaCheckCircle style={{ color: COLORS.success }} />;
      case 'join_rejected':
        return <FaTimes style={{ color: COLORS.danger }} />;
      case 'FAVORITE_ROUTE_MATCH':
        return <FaStar style={{ color: '#fbbf24' }} />;
      default:
        return <FaBell style={{ color: COLORS.secondary }} />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMs > 60000) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: COLORS.text 
      }}>
        <div>Loading notifications...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}
      >
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: COLORS.text,
            marginBottom: '0.5rem'
          }}>
            <FaBell style={{ marginRight: '0.5rem', color: COLORS.primary }} />
            Notifications
            {unreadCount > 0 && (
              <span style={{
                backgroundColor: COLORS.primary,
                color: '#000',
                padding: '0.25rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                marginLeft: '0.5rem',
                fontWeight: '500'
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{ color: COLORS.textMuted }}>
            Stay updated with your ride connections and activities
          </p>
        </div>
        
        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={markAllAsRead}
            style={{
              backgroundColor: COLORS.surfaceLight,
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Mark all as read
          </motion.button>
        )}
      </motion.div>

      {/* Notifications List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gap: '1rem' }}
      >
        {notifications.length === 0 ? (
          <motion.div
            variants={itemVariants}
            style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: COLORS.surfaceLight,
              borderRadius: '0.5rem',
              color: COLORS.textMuted
            }}
          >
            <FaBell style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <h3>No notifications found</h3>
            <p>You're all caught up! No new notifications at the moment.</p>
          </motion.div>
        ) : (
          notifications.map((notification) => (
            <motion.div
              key={notification.id}
              variants={itemVariants}
              whileHover={{ scale: notification.announcement_id ? 1.02 : 1 }}
              style={{
                backgroundColor: notification.is_read ? COLORS.surface : COLORS.surfaceLight,
                border: notification.is_read ? `1px solid ${COLORS.border}` : `2px solid ${COLORS.primary}`,
                borderRadius: '0.5rem',
                padding: '1rem',
                position: 'relative',
                transition: 'all 0.2s',
                cursor: notification.announcement_id ? 'pointer' : 'default'
              }}
              onClick={() => notification.announcement_id && handleNotificationClick(notification)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <h4 style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: COLORS.text,
                      marginBottom: '0.25rem'
                    }}>
                      {notification.title}
                    </h4>
                    
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: COLORS.textMuted,
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <p style={{ 
                    color: COLORS.textMuted, 
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem',
                    lineHeight: '1.4'
                  }}>
                    {notification.message}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: COLORS.textMuted 
                    }}>
                      {formatTimestamp(notification.created_at)}
                    </span>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {notification.announcement_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notification);
                          }}
                          style={{
                            backgroundColor: COLORS.primary,
                            color: '#000',
                            border: 'none',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <FaExternalLinkAlt />
                          View Ride
                        </button>
                      )}
                      
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          style={{
                            backgroundColor: COLORS.primary,
                            color: '#000',
                            border: 'none',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Mark as read
                        </button>
                      )}
                      
                      {notification.actionRequired && notification.type === 'connection_request' && (
                        <>
                          <button
                            onClick={() => handleConnectionRequest(notification.id, 'accepted')}
                            style={{
                              backgroundColor: COLORS.success,
                              color: '#fff',
                              border: 'none',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleConnectionRequest(notification.id, 'rejected')}
                            style={{
                              backgroundColor: COLORS.error,
                              color: '#fff',
                              border: 'none',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default Notifications;
