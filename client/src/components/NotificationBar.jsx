import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaUserFriends, FaComment, FaStar, FaCheckCircle, FaTimes, FaExternalLinkAlt, FaCar, FaSpinner } from 'react-icons/fa';
import { COLORS } from '../utils/constants';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { useToast } from '../hooks/useToast';
import { notificationAPI } from '../services/api';
import socket, { setNotificationHandler } from '../utils/socket';

const NotificationBar = () => {
  const navigate = useNavigate();
  const { user } = useSimpleAuth();
  const { success, error } = useToast();
  
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionLoading, setActionLoading] = useState({});
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up Socket.IO notification handler
      setNotificationHandler((data) => {
        console.log('🔔 Real-time notification in NotificationBar:', data);
        fetchNotifications(); // Refresh notifications
      });
      
      // Make fetchNotifications available globally
      window.refreshNotifications = fetchNotifications;
      
      return () => {
        setNotificationHandler(null);
      };
    }
  }, [user]);

  const createTestNotification = async () => {
    try {
      console.log('Creating test notification...');
      
      // Create a test notification via the API
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        success('Test notification created!');
        fetchNotifications(); // Refresh notifications
      } else {
        error('Failed to create test notification');
      }
    } catch (err) {
      console.error('Error creating test notification:', err);
      error('Failed to create test notification');
    }
  };

  const fetchNotifications = async () => {
    if (!user || !user.id) {
      console.log('🔔 No user or user.id available, skipping fetch');
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔔 Fetching notifications for user:', user.id);
      
      const response = await notificationAPI.getNotifications({ 
        recipient_id: user.id,
        limit: 10 
      });
      
      console.log('🔔 API Response:', response);
      
      // Try direct table query if RPC fails or returns undefined data
      let notifications = response.data || [];
      
      if (!notifications || notifications.length === 0 || notifications.some(n => !n.title || !n.message || n.title === 'undefined' || n.message === 'undefined')) {
        console.log('🔍 RPC returned no data or undefined values, trying direct query...');
        try {
          const directResponse = await fetch('https://linkcab-0t9d.onrender.com/api/notifications/direct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ recipient_id: user.id, limit: 10 })
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
      
      notifications = notifications.filter(n => n != null); // Filter out null notifications
      console.log('🔔 Final notifications to display:', notifications);
      console.log('🔔 Notification types:', notifications.map(n => n.type));
      console.log('🔔 Notification statuses:', notifications.map(n => n.status));
      
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
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
      case 'JOIN_REQUEST_REJECTED':
        return <FaTimes style={{ color: COLORS.error }} />;
      case 'new_message':
        return <FaComment style={{ color: COLORS.primary }} />;
      case 'FAVORITE_ROUTE_MATCH':
        return <FaStar style={{ color: '#fbbf24' }} />;
      case 'ride_completed':
        return <FaCar style={{ color: COLORS.success }} />;
      default:
        return <FaBell style={{ color: COLORS.textMuted }} />;
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      console.log('🔔 Notification clicked:', notification);
      
      // Mark as read
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      // Navigate based on notification type
      if (notification.type === 'FAVORITE_ROUTE_MATCH') {
        console.log('🔔 Navigating to announcements page for favorite route match');
        navigate('/announcements');
      } else if (notification.type === 'rating_received' || notification.type?.includes('review')) {
        console.log('🔔 Navigating to analytics page for review notification');
        navigate('/analytics');
      } else if ((notification.type === 'join_accepted' || notification.type === 'JOIN_REQUEST_ACCEPTED') && (notification.related_user_phone || notification.whatsapp_phone || notification.phone_number)) {
        const phoneNumber = notification.related_user_phone || notification.whatsapp_phone || notification.phone_number;
        const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[+\s-]/g, '')}?text=Hi, my request was accepted for the ride.`;
        console.log('🔔 Opening WhatsApp:', whatsappUrl);
        window.open(whatsappUrl, '_blank');
      } else if (notification.announcement_id) {
        console.log('🔔 Navigating to announcement (fallback):', notification.announcement_id);
        navigate(`/announcement/${notification.announcement_id}`);
      }
      
      setIsOpen(false);
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  const handleNotificationAction = async (notificationId, action) => {
    try {
      console.log(`🔔 ${action.toUpperCase()} action triggered for notification:`, notificationId);
      setActionLoading(prev => ({ ...prev, [`${notificationId}-${action}`]: true }));
      
      const response = await notificationAPI.actionNotification(notificationId, { action });
      
      console.log(`🔔 ${action.toUpperCase()} action response:`, response);
      
      if (response.success) {
        success(`Request ${action}ed successfully!`);
        
        // Remove the notification from the list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Refresh notifications
        fetchNotifications();
      } else {
        error(response.message || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      error(`Failed to ${action} request`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${notificationId}-${action}`]: false }));
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true, read_at: new Date().toISOString() } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Delete notification from database
      await notificationAPI.deleteNotification(notificationId);
      
      // Update local state - remove from notifications list
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      success('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
      error('Failed to delete notification');
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) {
      console.log('No timestamp provided, returning "Just now"');
      return 'Just now';
    }
    
    try {
      const now = new Date();
      const time = new Date(timestamp);
      
      // Check if the date is invalid
      if (isNaN(time.getTime())) {
        console.log('Invalid timestamp detected:', timestamp);
        return 'Just now';
      }
      
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch (error) {
      console.error('Error formatting time:', error, 'Timestamp:', timestamp);
      return 'Just now';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <FaBell size={20} color={COLORS.text} />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              backgroundColor: COLORS.error,
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              padding: '0.1rem 0.3rem',
              borderRadius: '10px',
              minWidth: '16px',
              textAlign: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              backgroundColor: 'white',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              width: '400px',
              maxHeight: '500px',
              overflow: 'hidden',
              zIndex: 1000,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1rem',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: COLORS.text }}>
                Notifications
              </h3>
              <button
                onClick={() => navigate('/notifications')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.primary,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                View All
              </button>
            </div>

            {/* Notifications List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.textMuted }}>
                  <FaSpinner className="fa-spin" /> Loading notifications...
                </div>
              ) : notifications.filter(n => n != null).length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.textMuted }}>
                  <FaBell style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                  <div>No notifications</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    You're all caught up!
                  </div>
                  <button
                    onClick={createTestNotification}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: COLORS.primary,
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Create Test Notification
                  </button>
                </div>
              ) : (
                notifications.filter(n => n != null).map((notification, index) => (
                  <div
                    key={notification?.id || `notification-${index}`}
                    style={{
                      padding: '1rem',
                      borderBottom: `1px solid ${COLORS.border}`,
                      backgroundColor: notification.is_read ? 'transparent' : '#f8fafc',
                    }}
                  >
                    {/* Notification Content */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      {/* Icon */}
                      <div style={{ marginTop: '0.25rem' }}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div 
                          onClick={() => handleNotificationClick(notification)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: COLORS.text, marginBottom: '0.25rem' }}>
                            {notification?.title || 'Notification'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: COLORS.textMuted, lineHeight: '1.4', marginBottom: '0.5rem' }}>
                            {notification?.message || 'You have a new notification'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>
                            {formatTimeAgo(notification?.created_at)}
                          </div>
                          {console.log('🔍 Individual notification data:', notification)}
                        </div>

                        {/* Action Buttons for join_request notifications - ONLY when status is pending */}
                        {notification?.type === 'join_request' && notification?.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <button
                              onClick={() => handleNotificationAction(notification.id, 'accept')}
                              disabled={actionLoading[`${notification.id}-accept`]}
                              style={{
                                backgroundColor: COLORS.success,
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: actionLoading[`${notification.id}-accept`] ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                opacity: actionLoading[`${notification.id}-accept`] ? 0.7 : 1,
                              }}
                            >
                              {actionLoading[`${notification.id}-accept`] ? (
                                <FaSpinner size={10} className="fa-spin" />
                              ) : (
                                <FaCheckCircle size={10} />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => handleNotificationAction(notification.id, 'reject')}
                              disabled={actionLoading[`${notification.id}-reject`]}
                              style={{
                                backgroundColor: COLORS.error,
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: actionLoading[`${notification.id}-reject`] ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                opacity: actionLoading[`${notification.id}-reject`] ? 0.7 : 1,
                              }}
                            >
                              {actionLoading[`${notification.id}-reject`] ? (
                                <FaSpinner size={10} className="fa-spin" />
                              ) : (
                                <FaTimes size={10} />
                              )}
                              Reject
                            </button>
                          </div>
                        )}

                        {/* WhatsApp button for join_accepted notifications */}
                        {(notification?.type === 'join_accepted' || notification?.type === 'JOIN_REQUEST_ACCEPTED') && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <button
                              onClick={() => {
                                const phoneNumber = notification?.related_user_phone || notification?.whatsapp_phone || notification?.phone_number;
                                if (phoneNumber) {
                                  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[+\s-]/g, '')}?text=Hi, my request was accepted for ride. Let's coordinate pickup details.`;
                                  console.log('🔔 Opening WhatsApp from NotificationBar button:', whatsappUrl);
                                  window.open(whatsappUrl, '_blank');
                                } else {
                                  console.error('❌ No phone number found for WhatsApp:', notification);
                                }
                              }}
                              style={{
                                backgroundColor: '#25D366',
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <FaExternalLinkAlt size={10} />
                              Contact on WhatsApp
                            </button>
                          </div>
                        )}

                        {/* View Ride button for FAVORITE_ROUTE_MATCH notifications */}
                        {notification?.type === 'FAVORITE_ROUTE_MATCH' && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <button
                              onClick={() => {
                                navigate('/announcements');
                              }}
                              style={{
                                backgroundColor: COLORS.primary,
                                color: '#000',
                                border: 'none',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                              }}
                            >
                              <FaCar size={10} />
                              View Ride Details
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent notification click
                          deleteNotification(notification.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: COLORS.textMuted,
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          fontSize: '0.875rem'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#fee2e2';
                          e.target.style.color = COLORS.error;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = COLORS.textMuted;
                        }}
                        title="Delete notification"
                      >
                        <FaTimes />
                      </button>

                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: COLORS.primary,
                            borderRadius: '50%',
                            marginTop: '0.5rem',
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBar;
