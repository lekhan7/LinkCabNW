import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaUserFriends, FaComment, FaStar, FaCheckCircle, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import { COLORS } from '../utils/constants';
import useCoPassengerNotifications from '../hooks/useCoPassengerNotifications';
import { useToast } from '../hooks/useToast';
import Avatar from './Avatar';
import { announcementAPI, userAPI } from '../services/api';

const NotificationBar = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { 
    notifications, 
    hasNewNotification, 
    notificationCount, 
    isLoading,
    backendAvailable,
    fetchNotifications,
    markAsRead, 
    clearNotifications,
    removeNotification 
  } = useCoPassengerNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'join_request':
        return <FaUserFriends style={{ color: COLORS.info }} />;
      case 'join_accepted':
      case 'JOIN_REQUEST_ACCEPTED':
        return <FaCheckCircle style={{ color: COLORS.success }} />;
      case 'go_ride_request':
        return <FaStar style={{ color: '#fbbf24' }} />;
      case 'new_message':
        return <FaComment style={{ color: COLORS.primary }} />;
      case 'chat_joined':
        return <FaComment style={{ color: COLORS.info }} />;
      case 'announcement_joined':
        return <FaStar style={{ color: COLORS.warning }} />;
      case 'new_co_passenger':
        return <FaUserFriends style={{ color: COLORS.success }} />;
      default:
        return <FaBell style={{ color: COLORS.textMuted }} />;
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

  const handleNotificationClick = (notification) => {
    // Remove the notification from the list when clicked
    removeNotification(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'join_request':
        navigate('/my-announcements');
        break;
      case 'go_ride_request':
        navigate('/my-announcements');
        break;
      case 'new_message':
      case 'chat_joined':
        navigate('/chat');
        break;
      case 'join_accepted':
        // Handle WhatsApp redirect for accepted requests
        if (notification.related_user_phone) {
          const cleanPhone = notification.related_user_phone.replace(/[^0-9]/g, '');
          window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
        break;
      case 'JOIN_REQUEST_ACCEPTED':
        // Handle WhatsApp redirect for accepted requests
        if (notification.related_user_phone) {
          const cleanPhone = notification.related_user_phone.replace(/[^0-9]/g, '');
          window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
        break;
      case 'new_co_passenger':
        navigate('/going-rides');
        break;
      default:
        navigate('/notifications');
    }
    
    setIsOpen(false);
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setIsOpen(false);
  };

  const handleAcceptRequest = async (notification) => {
    try {
      if (!notification.request_id || !notification.announcement_id) {
        console.error('Missing request_id or announcement_id');
        return;
      }

      // Get the sender's name from the notification
      const senderName = notification.sender_name || notification.sender?.name || 'the user';

      // Update request status in database
      const response = await announcementAPI.respondToJoinRequest(
        notification.announcement_id, 
        notification.request_id, 
        { action: 'accept' }
      );

      // Show success toast
      success(`You have accepted ${senderName}'s request to join your ride!`);

      // Remove the notification from the list immediately
      await removeNotification(notification.id);
      
      console.log('Request accepted and notification removed');
    } catch (err) {
      console.error('Error accepting request:', err);
      error(err.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (notification) => {
    try {
      if (!notification.request_id || !notification.announcement_id) {
        console.error('Missing request_id or announcement_id');
        return;
      }

      // Get the sender's name from the notification
      const senderName = notification.sender_name || notification.sender?.name || 'the user';

      // Update request status in database
      const response = await announcementAPI.respondToJoinRequest(
        notification.announcement_id, 
        notification.request_id, 
        { action: 'reject' }
      );

      // Show success toast
      success(`You have rejected ${senderName}'s request to join your ride.`);

      // Remove the notification from the list immediately
      await removeNotification(notification.id);
      
      console.log('Request rejected and notification removed');
    } catch (err) {
      console.error('Error rejecting request:', err);
      error(err.message || 'Failed to reject request');
    }
  };

  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: -10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          color: COLORS.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <FaBell size={20} />
        
        {/* Backend Status Indicator */}
        {!backendAvailable && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: COLORS.error,
            animation: 'pulse 2s infinite'
          }} />
        )}
        
        {/* Notification Badge */}
        {notificationCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: COLORS.error,
              color: '#fff',
              fontSize: '10px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '18px'
            }}
          >
            {notificationCount > 9 ? '9+' : notificationCount}
          </motion.div>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '0.5rem',
              width: '380px',
              maxHeight: '480px',
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              zIndex: 1000
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem',
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1rem', 
                fontWeight: '600',
                color: COLORS.text 
              }}>
                Notifications
                {notificationCount > 0 && (
                  <span style={{
                    backgroundColor: COLORS.primary,
                    color: '#000',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    marginLeft: '0.5rem',
                    fontWeight: '500'
                  }}>
                    {notificationCount}
                  </span>
                )}
              </h3>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {notificationCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotifications();
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: COLORS.textMuted,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div style={{
              maxHeight: '350px',
              overflowY: 'auto'
            }}>
              {isLoading ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: COLORS.textMuted
                }}>
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: COLORS.textMuted
                }}>
                  {backendAvailable ? (
                    <>
                      <FaBell style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                      <p>No notifications</p>
                    </>
                  ) : (
                    <>
                      <FaBell style={{ fontSize: '2rem', marginBottom: '0.5rem', color: COLORS.error }} />
                      <p>Backend unavailable</p>
                      <p style={{ fontSize: '0.875rem' }}>Server is being developed</p>
                      <p style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>Try again in a few minutes</p>
                    </>
                  )}
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    whileHover={{ backgroundColor: COLORS.surfaceLight }}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '1rem',
                      borderBottom: `1px solid ${COLORS.border}`,
                      cursor: 'pointer',
                      backgroundColor: notification.is_read ? 'transparent' : COLORS.surfaceLight,
                      position: 'relative'
                    }}
                  >
                    {!notification.is_read && (
                      <div style={{
                        position: 'absolute',
                        left: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: COLORS.primary
                      }} />
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ fontSize: '1.25rem', marginTop: '0.125rem' }}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.25rem'
                        }}>
                          <h4 style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: COLORS.text,
                            lineHeight: '1.3'
                          }}>
                            {notification.title}
                          </h4>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: COLORS.textMuted,
                              cursor: 'pointer',
                              padding: '0.125rem',
                              borderRadius: '0.25rem',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                        
                        <p style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: COLORS.textMuted,
                          lineHeight: '1.4',
                          marginBottom: '0.5rem'
                        }}>
                          {notification.message}
                        </p>
                        
                        {/* Accept/Reject buttons for join requests */}
                        {(notification.type === 'join_request' || notification.type === 'JOIN_REQUEST') && (
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            marginBottom: '0.5rem' 
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptRequest(notification);
                              }}
                              style={{
                                backgroundColor: COLORS.success,
                                color: '#fff',
                                border: 'none',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectRequest(notification);
                              }}
                              style={{
                                backgroundColor: COLORS.error,
                                color: '#fff',
                                border: 'none',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        
                        <span style={{
                          fontSize: '0.625rem',
                          color: COLORS.textMuted
                        }}>
                          {formatTimestamp(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{
                padding: '0.75rem',
                borderTop: `1px solid ${COLORS.border}`,
                textAlign: 'center'
              }}>
                <button
                  onClick={handleViewAll}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: COLORS.primary,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto'
                  }}
                >
                  View all notifications
                  <FaExternalLinkAlt size={12} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBar;
