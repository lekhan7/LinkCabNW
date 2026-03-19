import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';
import { 
  FaUsers, 
  FaBullhorn, 
  FaCar, 
  FaHandshake, 
  FaExclamationTriangle, 
  FaStar, 
  FaBell 
} from 'react-icons/fa';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAnnouncements: 0,
    activeRides: 0,
    totalJoinRequests: 0,
    totalReports: 0,
    totalReviews: 0,
    totalNotifications: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Use mock data for now to avoid Supabase RLS issues
      // In production, this should call the admin API endpoints
      const mockStats = {
        totalUsers: 150,
        totalAnnouncements: 45,
        activeRides: 12,
        totalJoinRequests: 8,
        totalReports: 3,
        totalReviews: 25,
        totalNotifications: 67,
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats');
      console.error('Dashboard stats error:', error);
      // Set default values on error
      setStats({
        totalUsers: 0,
        totalAnnouncements: 0,
        activeRides: 0,
        totalJoinRequests: 0,
        totalReports: 0,
        totalReviews: 0,
        totalNotifications: 0,
      });
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Use mock data for now to avoid Supabase RLS issues
      const mockActivity = [
        {
          id: 1,
          type: 'announcement',
          message: 'New ride announcement created',
          timestamp: new Date().toISOString(),
          user: 'John Doe'
        },
        {
          id: 2,
          type: 'review',
          message: 'New review submitted',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'Jane Smith'
        },
        {
          id: 3,
          type: 'report',
          message: 'User report filed',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: 'Admin'
        }
      ];

      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to fetch recent activity');
      console.error('Recent activity error:', error);
      setRecentActivity([]);
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <FaUsers />, color: '#3B82F6' },
    { label: 'Total Announcements', value: stats.totalAnnouncements, icon: <FaBullhorn />, color: '#10B981' },
    { label: 'Active Rides', value: stats.activeRides, icon: <FaCar />, color: '#F59E0B' },
    { label: 'Join Requests', value: stats.totalJoinRequests, icon: <FaHandshake />, color: '#8B5CF6' },
    { label: 'Total Reports', value: stats.totalReports, icon: <FaExclamationTriangle />, color: '#EF4444' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: <FaStar />, color: '#F59E0B' },
    { label: 'Notifications', value: stats.totalNotifications, icon: <FaBell />, color: '#06B6D4' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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
          <p style={{ color: COLORS.text }}>Loading dashboard data...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '2rem' }}>
          Dashboard Overview
        </h1>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E5E7EB',
                transition: 'all 0.3s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.text }}>
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: stat.color + '20',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  {stat.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1rem' }}>
              Recent Activity
            </h2>
            {recentActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '0.5rem',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{activity.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: COLORS.text, fontSize: '0.875rem', margin: 0 }}>
                        {activity.message}
                      </p>
                      <p style={{ color: '#6B7280', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
                        {formatTimeAgo(activity.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6B7280', textAlign: 'center', padding: '2rem' }}>
                No recent activity found
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOverview;
