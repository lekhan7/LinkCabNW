import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Outlet, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { COLORS } from '../../utils/constants';
import { 
  FaChartBar, 
  FaUsers, 
  FaBullhorn, 
  FaStar, 
  FaComments, 
  FaExclamationTriangle, 
  FaChartLine, 
  FaCog,
  FaShieldAlt,
  FaSignOutAlt
} from 'react-icons/fa';
import { supabase } from '../../config/supabase';

// Import admin pages
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminAnnouncements from './AdminAnnouncements';
import AdminReviews from './AdminReviews';
import AdminReports from './AdminReports';
import AdminAnalytics from './AdminAnalytics';
import AdminSettings from './AdminSettings';
import AdminFeedback from './AdminFeedback';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard Overview', icon: <FaChartBar /> },
    { path: '/admin/users', label: 'Users', icon: <FaUsers /> },
    { path: '/admin/announcements', label: 'Announcements', icon: <FaBullhorn /> },
    { path: '/admin/reviews', label: 'Reviews', icon: <FaStar /> },
    { path: '/admin/feedback', label: 'Feedback', icon: <FaComments /> },
    { path: '/admin/reports', label: 'Reports', icon: <FaExclamationTriangle /> },
    { path: '/admin/analytics', label: 'Analytics', icon: <FaChartLine /> },
    { path: '/admin/settings', label: 'Settings', icon: <FaCog /> },
  ];

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/admin/login');
        return;
      }

      // First check if user has admin credentials stored in session
      const isAdminFromSession = sessionStorage.getItem('isAdmin') === 'true';
      
      if (isAdminFromSession && session.user.email === 'admin@gmail.com') {
        setLoading(false);
        return;
      }

      // For other users, verify admin role from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !userData || userData.role !== 'admin') {
        await supabase.auth.signOut();
        console.error('Access denied. Admin privileges required.');
        navigate('/admin/login');
        return;
      }
    } catch (error) {
      console.error('Authentication error');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      console.log('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.background,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: `4px solid ${COLORS.primary}20`,
              borderTop: `4px solid ${COLORS.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: COLORS.text }}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Sidebar */}
      <motion.div
        initial={{ width: sidebarOpen ? 250 : 80 }}
        animate={{ width: sidebarOpen ? 250 : 80 }}
        transition={{ duration: 0.3 }}
        style={{
          backgroundColor: 'white',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: COLORS.primary,
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              <FaShieldAlt />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                  Admin Panel
                </h2>
                <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0 }}>
                  Management System
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  padding: sidebarOpen ? '0.875rem 1.5rem' : '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: sidebarOpen ? '0.75rem' : '0',
                  backgroundColor: isActive ? COLORS.primary + '20' : 'transparent',
                  color: isActive ? COLORS.primary : '#6B7280',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '400',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = '#F3F4F6';
                    e.target.style.color = COLORS.text;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#6B7280';
                  }
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'center' : 'center',
              gap: sidebarOpen ? '0.5rem' : '0',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#DC2626';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#EF4444';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <span><FaSignOutAlt /></span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.div>

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          left: sidebarOpen ? '260px' : '90px',
          top: '1rem',
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s',
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#F9FAFB';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>
          {sidebarOpen ? '◀' : '▶'}
        </span>
      </button>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? '0' : '0' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ padding: '2rem' }}
        >
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
