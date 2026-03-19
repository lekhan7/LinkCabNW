import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../utils/constants';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { useToast } from '../hooks/useToast';
import { FaBell, FaUserFriends, FaComment, FaStar, FaCheckCircle, FaTimes, FaExternalLinkAlt, FaCar } from 'react-icons/fa';
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
    if (!user || !user.id) {
      console.log('No user or user.id available, skipping fetch');
      setNotifications([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Fetch real notifications from database
      const response = await notificationAPI.getNotifications({ 
        recipient_id: user.id,
        limit: 50 
      });
      
      let notifications = response.data || [];
      
      // Try direct query if RPC fails or returns undefined data
      if (!notifications || notifications.length === 0 || notifications.some(n => !n.title || !n.message || n.title === 'undefined' || n.message === 'undefined')) {
        console.log('🔍 RPC returned no data or undefined values, trying direct query...');
        try {
          const directResponse = await fetch('https://linkcab-0t9d.onrender.com/api/notifications/direct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ recipient_id: user.id, limit: 50 })
          });
          
          if (directResponse.ok) {
            const directData = await directResponse.json();
            notifications = directData.data || [];
            console.log('🔍 Direct query result:', notifications);
          }
        } catch (directErr) {
          console.error('Direct query failed:', directErr);
        }
      }
      
      const finalNotifications = notifications.filter(n => n != null); // Filter out null notifications
      console.log('🔔 Fetched notifications:', finalNotifications);
      setNotifications(finalNotifications);
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
      setNotifications([]); // Set empty array on error
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

      // Navigate based on notification type
      if (notification.type === 'FAVORITE_ROUTE_MATCH') {
        // Navigate to announcements list (not details)
        navigate('/announcements');
      } else if (notification.type === 'rating_received' || notification.type?.includes('review')) {
        // Navigate to analytics page for review notifications
        navigate('/analytics');
      } else if ((notification.type === 'join_accepted' || notification.type === 'JOIN_REQUEST_ACCEPTED') && (notification.related_user_phone || notification.whatsapp_phone || notification.phone_number)) {
        // Open WhatsApp with the creator's phone number
        const phoneNumber = notification.related_user_phone || notification.whatsapp_phone || notification.phone_number;
        const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[+\s-]/g, '')}?text=Hi, my request was accepted for the ride.`;
        console.log('🔔 Opening WhatsApp:', whatsappUrl);
        window.open(whatsappUrl, '_blank');
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
      success('Notification marked as read');
    } catch (err) {
      error('Failed to mark notification as read');
    }
  };

  const handleConnectionRequest = async (notificationId, action) => {
    try {
      console.log(`🔔 Frontend sending action:`, { notificationId, action });
      
      const response = await notificationAPI.actionNotification(notificationId, { action });
      
      console.log(`🔔 Frontend received response:`, response);
      
      if (response.success) {
        success(`Request ${action}ed successfully`);
        
        // Remove the notification from the list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        error(response.message || `Failed to ${action} connection request`);
      }
    } catch (err) {
      console.error('Error handling connection request:', err);
      error(`Failed to ${action} connection request`);
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'join_request':
        return <FaUserFriends style={{ color: COLORS.info }} />;
      case 'join_accepted':
      case 'JOIN_REQUEST_ACCEPTED':
        return <FaCheckCircle style={{ color: COLORS.success }} />;
      case 'join_rejected':
        return <FaTimes style={{ color: COLORS.error }} />;
      case 'new_message':
        return <FaComment style={{ color: COLORS.primary }} />;
      case 'chat_joined':
        return <FaComment style={{ color: COLORS.info }} />;
      case 'announcement_joined':
        return <FaStar style={{ color: COLORS.warning }} />;
      case 'FAVORITE_ROUTE_MATCH':
        return <FaStar style={{ color: COLORS.primary }} />;
      case 'trip_completed':
        return <FaStar style={{ color: COLORS.warning }} />;
      case 'rating_received':
        return <FaStar style={{ color: COLORS.primary }} />;
      default:
        return <FaBell style={{ color: COLORS.textMuted }} />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      console.log('No timestamp provided, returning "Just now"');
      return 'Just now';
    }
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Check if the date is invalid
      if (isNaN(date.getTime())) {
        console.log('Invalid timestamp detected:', timestamp);
        return 'Just now';
      }
      
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
    } catch (error) {
      console.error('Error formatting timestamp:', error, 'Timestamp:', timestamp);
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
          notifications.filter(n => n != null).map((notification, index) => (
            <motion.div
              key={notification?.id || `notification-${index}`}
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
                      {notification?.title || 'Notification'}
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
                    {notification?.message || 
                      (notification?.type === 'join_request' ? 'Someone wants to join your ride!' :
                      notification?.type === 'join_accepted' ? 'Your ride request was accepted! Contact them on WhatsApp.' :
                      notification?.type === 'join_rejected' ? 'Your ride request was rejected.' :
                      notification?.title || 'You have a new notification')
                    }
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
                      
                      // Action buttons for different notification types
                      {notification?.type === 'join_request' && notification?.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleConnectionRequest(notification.id, 'accept')}
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
                            onClick={() => handleConnectionRequest(notification.id, 'reject')}
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
                      
                      {(notification?.type === 'join_accepted' || notification?.type === 'JOIN_REQUEST_ACCEPTED') && (
                        <button
                          onClick={() => {
                            const phoneNumber = notification?.related_user_phone || notification?.whatsapp_phone || notification?.phone_number;
                            if (phoneNumber) {
                              const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[+\s-]/g, '')}?text=Hi, my request was accepted for the ride. Let's coordinate pickup details.`;
                              console.log('🔔 Opening WhatsApp from button:', whatsappUrl);
                              window.open(whatsappUrl, '_blank');
                            } else {
                              console.error('❌ No phone number found for WhatsApp:', notification);
                            }
                          }}
                          style={{
                            backgroundColor: '#25D366',
                            color: 'white',
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
                          WhatsApp
                        </button>
                      )}
                      
                      {notification?.type === 'FAVORITE_ROUTE_MATCH' && (
                        <button
                          onClick={() => navigate('/announcements')}
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
                          <FaCar />
                          View Rides
                        </button>
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
