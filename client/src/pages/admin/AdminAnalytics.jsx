import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    announcementGrowth: [],
    rideCompletionRate: 0,
    starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    reportFrequency: [],
    totalUsers: 0,
    totalAnnouncements: 0,
    totalReviews: 0,
    totalReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get date range based on timeRange
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Fetch user growth data
      const { data: usersData } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Fetch announcement growth data
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Fetch reviews for star distribution
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating');

      // Fetch reports for frequency
      const { data: reportsData } = await supabase
        .from('reports')
        .select('created_at, reason')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Process data
      const userGrowth = processGrowthData(usersData, startDate);
      const announcementGrowth = processGrowthData(announcementsData, startDate);
      const starDistribution = processStarDistribution(reviewsData);
      const reportFrequency = processReportFrequency(reportsData, startDate);
      
      // Calculate completion rate
      const completedRides = announcementsData?.filter(a => a.status === 'completed').length || 0;
      const totalRides = announcementsData?.length || 0;
      const rideCompletionRate = totalRides > 0 ? (completedRides / totalRides) * 100 : 0;

      // Get totals
      const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact' });
      const { count: totalAnnouncements } = await supabase.from('announcements').select('*', { count: 'exact' });
      const { count: totalReviews } = await supabase.from('reviews').select('*', { count: 'exact' });
      const { count: totalReports } = await supabase.from('reports').select('*', { count: 'exact' });

      setAnalytics({
        userGrowth,
        announcementGrowth,
        rideCompletionRate,
        starDistribution,
        reportFrequency,
        totalUsers: totalUsers || 0,
        totalAnnouncements: totalAnnouncements || 0,
        totalReviews: totalReviews || 0,
        totalReports: totalReports || 0,
      });
    } catch (error) {
      console.error('Failed to fetch analytics');
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processGrowthData = (data, startDate) => {
    if (!data) return [];
    
    const dailyCount = {};
    const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyCount[dateStr] = 0;
    }
    
    // Count actual data
    data.forEach(item => {
      const dateStr = new Date(item.created_at).toISOString().split('T')[0];
      if (dailyCount[dateStr] !== undefined) {
        dailyCount[dateStr]++;
      }
    });
    
    return Object.entries(dailyCount).map(([date, count]) => ({
      date,
      count,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  };

  const processStarDistribution = (reviews) => {
    if (!reviews) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });
    
    return distribution;
  };

  const processReportFrequency = (reports, startDate) => {
    if (!reports) return [];
    
    const dailyCount = {};
    const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyCount[dateStr] = 0;
    }
    
    // Count actual reports
    reports.forEach(report => {
      const dateStr = new Date(report.created_at).toISOString().split('T')[0];
      if (dailyCount[dateStr] !== undefined) {
        dailyCount[dateStr]++;
      }
    });
    
    return Object.entries(dailyCount).map(([date, count]) => ({
      date,
      count,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  };

  const renderSimpleChart = (data, color, title) => {
    const maxValue = Math.max(...data.map(d => d.count), 1);
    
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1rem' }}>
          {title}
        </h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
          {data.slice(-30).map((item, index) => (
            <div
              key={item.date}
              style={{
                flex: 1,
                height: `${(item.count / maxValue) * 180}px`,
                backgroundColor: color,
                borderRadius: '2px',
                opacity: 0.8,
                transition: 'all 0.3s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = 1;
                e.currentTarget.style.transform = 'scaleY(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = 0.8;
                e.currentTarget.style.transform = 'scaleY(1)';
              }}
              title={`${item.label}: ${item.count}`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
          <span>{data[0]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
    );
  };

  const renderStarChart = (distribution) => {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1rem' }}>
          Star Distribution
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[5, 4, 3, 2, 1].map(stars => {
            const count = distribution[stars];
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '60px', fontSize: '0.875rem', color: COLORS.text }}>
                  {'⭐'.repeat(stars)} {stars}
                </div>
                <div style={{ flex: 1, height: '24px', backgroundColor: '#E5E7EB', borderRadius: '0.25rem', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: stars >= 4 ? '#10B981' : stars >= 3 ? '#F59E0B' : '#EF4444',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <div style={{ width: '50px', fontSize: '0.875rem', color: '#6B7280', textAlign: 'right' }}>
                  {count} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
          <p style={{ color: COLORS.text }}>Loading analytics...</p>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.text }}>
            Analytics Dashboard
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#3B82F620',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                👥
              </div>
              <div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Users</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.text }}>
                  {analytics.totalUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#10B98120',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                📢
              </div>
              <div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Rides</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.text }}>
                  {analytics.totalAnnouncements.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#F59E0B20',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                ⭐
              </div>
              <div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Reviews</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.text }}>
                  {analytics.totalReviews.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#EF444420',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                🚨
              </div>
              <div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Reports</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.text }}>
                  {analytics.totalReports.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
        }}>
          {renderSimpleChart(analytics.userGrowth, '#3B82F6', 'User Growth')}
          {renderSimpleChart(analytics.announcementGrowth, '#10B981', 'Announcement Growth')}
          {renderStarChart(analytics.starDistribution)}
          {renderSimpleChart(analytics.reportFrequency, '#EF4444', 'Report Frequency')}
        </div>

        {/* Completion Rate */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
          marginTop: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1rem' }}>
            Ride Completion Rate
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(${analytics.rideCompletionRate > 70 ? '#10B981' : analytics.rideCompletionRate > 40 ? '#F59E0B' : '#EF4444'} ${analytics.rideCompletionRate}%, #E5E7EB ${analytics.rideCompletionRate}%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: COLORS.text,
              }}>
                {analytics.rideCompletionRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                {analytics.rideCompletionRate > 70 ? 'Excellent completion rate!' : 
                 analytics.rideCompletionRate > 40 ? 'Moderate completion rate' : 
                 'Low completion rate - needs attention'}
              </p>
              <p style={{ fontSize: '0.875rem', color: COLORS.text }}>
                This metric shows the percentage of rides that are successfully completed.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminAnalytics;
