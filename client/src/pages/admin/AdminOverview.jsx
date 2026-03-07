import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';

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
      const [
        usersCount,
        announcementsCount,
        activeRidesCount,
        joinRequestsCount,
        reportsCount,
        reviewsCount,
        notificationsCount
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('announcements').select('id', { count: 'exact' }),
        supabase.from('announcements').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('join_requests').select('id', { count: 'exact' }),
        supabase.from('reports').select('id', { count: 'exact' }),
        supabase.from('reviews').select('id', { count: 'exact' }),
        supabase.from('notifications').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalAnnouncements: announcementsCount.count || 0,
        activeRides: activeRidesCount.count || 0,
        totalJoinRequests: joinRequestsCount.count || 0,
        totalReports: reportsCount.count || 0,
        totalReviews: reviewsCount.count || 0,
        totalNotifications: notificationsCount.count || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats');
      console.error('Dashboard stats error:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent activities from different tables
      const [
        recentAnnouncements,
        recentReviews,
        recentReports,
        recentJoinRequests
      ] = await Promise.all([
        supabase
          .from('announcements')
          .select('created_at, creator_name, from_location, to_location')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('reviews')
          .select('created_at, reviewer_name, reviewed_user_name, rating')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('reports')
          .select('created_at, reporter_name, reported_user_name, reason')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('join_requests')
          .select('created_at, passenger_name, status')
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      const activities = [
        ...recentAnnouncements.data?.map(item => ({
          type: 'announcement',
          message: `${item.creator_name} created ride from ${item.from_location} to ${item.to_location}`,
          time: item.created_at,
          icon: '📢'
        })) || [],
        ...recentReviews.data?.map(item => ({
          type: 'review',
          message: `${item.reviewer_name} reviewed ${item.reviewed_user_name} (${item.rating}⭐)`,
          time: item.created_at,
          icon: '⭐'
        })) || [],
        ...recentReports.data?.map(item => ({
          type: 'report',
          message: `${item.reporter_name} reported ${item.reported_user_name}: ${item.reason}`,
          time: item.created_at,
          icon: '🚨'
        })) || [],
        ...recentJoinRequests.data?.map(item => ({
          type: 'join_request',
          message: `${item.passenger_name} requested to join ride (${item.status})`,
          time: item.created_at,
          icon: '🤝'
        })) || []
      ];

      // Sort by time and take latest 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10);

      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error('Failed to fetch recent activity');
      console.error('Recent activity error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#3B82F6' },
    { label: 'Total Announcements', value: stats.totalAnnouncements, icon: '📢', color: '#10B981' },
    { label: 'Active Rides', value: stats.activeRides, icon: '🚗', color: '#F59E0B' },
    { label: 'Join Requests', value: stats.totalJoinRequests, icon: '🤝', color: '#8B5CF6' },
    { label: 'Total Reports', value: stats.totalReports, icon: '🚨', color: '#EF4444' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: '⭐', color: '#F59E0B' },
    { label: 'Notifications', value: stats.totalNotifications, icon: '🔔', color: '#06B6D4' },
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
