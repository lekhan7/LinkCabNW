import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import useCoPassengerNotifications from '../hooks/useCoPassengerNotifications';
import NotificationBar from './NotificationBar';
import Avatar from './Avatar';
import { COLORS } from '../utils/constants';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasNewNotification, notificationCount, clearNotifications } = useCoPassengerNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    show('Logged out successfully', 'success');
    setShowUserMenu(false);
  };

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: 'Home' },
    { path: '/co-passenger-management', label: 'Manage Co-Passengers', icon: 'Users' },
    { path: '/announcements', label: 'Announcements', icon: 'Announce' },
    { path: '/my-announcements', label: 'My Announcements', icon: 'MyAnnounce' },
    { path: '/favorite-rides', label: 'Favorite Rides', icon: 'Favorite' },
    { path: '/analytics', label: 'Analytics', icon: 'Analytics' },
    { path: '/profile', label: 'Profile', icon: 'Profile' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #000000',
          padding: '1rem 2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto',
            gap: '2rem'
          }}
        >
          {/* Logo */}
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: '#000000',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginRight: '1rem'
            }}
          >
            <img 
              src="/logo.png" 
              alt="LinkCab Logo"
              style={{
                width: '50px',
                height: '50px',
                marginBottom: '0.25rem',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #F5C400'
              }}
            />
            <span style={{ fontSize: '1rem' }}>LinkCab</span>
          </Link>

          {/* Desktop Navigation Items */}
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
              flex: 1
            }}
            className="desktop-nav"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (item.hasNotification && item.path === '/co-passenger-status') {
                    clearNotifications();
                  }
                }}
                style={{
                  textDecoration: 'none',
                  color: isActive(item.path) ? '#F5C400' : '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  fontWeight: isActive(item.path) ? '600' : '500'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.backgroundColor = 'rgba(245, 196, 0, 0.1)';
                    e.target.style.color = '#F5C400';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#000000';
                  }
                }}
              >
                <span>{item.label}</span>
                {/* Underline Animation */}
                {isActive(item.path) && (
                  <motion.div
                    layoutId={`underline-${item.path}`}
                    initial={false}
                    animate={{
                      width: '100%',
                      opacity: 1
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: 0,
                      height: '3px',
                      backgroundColor: '#F5C400',
                      borderRadius: '2px'
                    }}
                  />
                )}
                {!isActive(item.path) && (
                  <motion.div
                    layoutId={`underline-${item.path}`}
                    initial={{ width: '0%', opacity: 0 }}
                    whileHover={{ width: '100%', opacity: 1 }}
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: 0,
                      height: '2px',
                      backgroundColor: '#F5C400',
                      borderRadius: '2px'
                    }}
                  />
                )}
                {item.hasNotification && hasNewNotification && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                )}
              </Link>
            ))}

            {/* Notification Bar */}
            <NotificationBar />

            {/* User Menu */}
            <div style={{ position: 'relative', marginLeft: '1rem' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#ffffff',
                  border: '2px solid #000000',
                  borderRadius: '8px',
                  color: '#000000',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(245, 196, 0, 0.1)';
                  e.target.style.borderColor = '#F5C400';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.borderColor = '#000000';
                }}
              >
                <Avatar
                  imageUrl={user?.profilePicture}
                  username={user?.name}
                  size="small"
                />
                <span>{user?.name || 'User'}</span>
                <span>▼</span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      backgroundColor: '#ffffff',
                      border: '2px solid #000000',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      minWidth: '200px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#000000',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(245, 196, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/emergency-support#feedback');
                        setShowUserMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#000000',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(245, 196, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      Feedback
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#FF4444',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              zIndex: 1001
            }}
            className="mobile-menu-button"
          >
            <div style={{ width: '25px', height: '20px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                height: '3px',
                width: '100%',
                backgroundColor: '#000000',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                transform: mobileMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'rotate(0deg)'
              }} />
              <div style={{
                position: 'absolute',
                height: '3px',
                width: '100%',
                backgroundColor: '#000000',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                opacity: mobileMenuOpen ? 0 : 1,
                top: '8px'
              }} />
              <div style={{
                position: 'absolute',
                height: '3px',
                width: '100%',
                backgroundColor: '#000000',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                transform: mobileMenuOpen ? 'rotate(-45deg) translate(7px, -8px)' : 'rotate(0deg)',
                top: '16px'
              }} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '80%',
              maxWidth: '300px',
              height: '100vh',
              backgroundColor: '#ffffff',
              borderLeft: '2px solid #000000',
              zIndex: 999,
              padding: '2rem 1rem',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ margin: 0, color: '#000000' }}>Menu</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.hasNotification && item.path === '/co-passenger-status') {
                      clearNotifications();
                    }
                  }}
                  style={{
                    textDecoration: 'none',
                    color: isActive(item.path) ? '#F5C400' : '#000000',
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: isActive(item.path) ? 'rgba(245, 196, 0, 0.1)' : 'transparent',
                    transition: 'all 0.3s ease',
                    fontWeight: isActive(item.path) ? '600' : '500'
                  }}
                >
                  {item.label}
                </Link>
              ))}

              <div style={{ borderTop: '1px solid #000000', paddingTop: '1rem', marginTop: '1rem' }}>
                <NotificationBar />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '8px' }}>
                <Avatar
                  imageUrl={user?.profilePicture}
                  username={user?.name}
                  size="small"
                />
                <span style={{ color: '#000000' }}>{user?.name || 'User'}</span>
              </div>

              <button
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: 'transparent',
                  border: '2px solid #000000',
                  borderRadius: '8px',
                  color: '#000000',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginBottom: '0.5rem'
                }}
              >
                Profile
              </button>

              <button
                onClick={() => {
                  navigate('/emergency-support#feedback');
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: 'transparent',
                  border: '2px solid #000000',
                  borderRadius: '8px',
                  color: '#000000',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginBottom: '0.5rem'
                }}
              >
                Feedback
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#FF4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998
          }}
        />
      )}

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
