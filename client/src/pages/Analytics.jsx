import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { supabase } from '../utils/supabase';
import { useLocation } from 'react-router-dom';
import { FaUsers, FaCheckCircle, FaStar, FaRoute, FaCalendarAlt, FaChartLine, FaExclamationTriangle, FaUserCheck, FaUserTimes, FaFlag } from 'react-icons/fa';
import { userAnalyticsAPI, reportAPI } from '../services/api';

const Analytics = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    profileStats: {
      totalReviews: 0,
      totalReports: 0,
      ridesCreated: 0,
      ridesJoined: 0,
      ridesCompleted: 0,
      ridesCancelled: 0
    },
    performanceStats: {
      completionRate: 0,
      joinRate: 0,
      averageRating: 0,
      totalRatingCount: 0
    },
    activityStats: {
      ridesCreatedThisMonth: 0,
      ridesJoinedThisMonth: 0,
      completedRidesThisMonth: 0,
      reportsThisMonth: 0
    },
    reviews: [],
    reports: [],
    starDistribution: {
      '5_star': 0,
      '4_star': 0,
      '3_star': 0,
      '2_star': 0,
      '1_star': 0
    }
  });
  const location = useLocation();
  const reviewsSectionRef = useRef(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setError('Authentication error');
          setSession(null);
        } else {
          setSession(session);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setError('Session check failed');
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserAnalytics();
      const subscriptions = setupRealtimeSubscriptions();
      
      // Cleanup function
      return () => {
        if (subscriptions) {
          subscriptions.forEach(subscription => {
            supabase.removeChannel(subscription);
          });
        }
      };
    }
  }, [session]);

  const setupRealtimeSubscriptions = () => {
    if (!session?.user?.id) return;
    
    const userId = session.user.id;
    const subscriptions = [];
    
    // Subscribe to reviews table for new reviews
    const reviewsSubscription = supabase
      .channel('analytics-reviews')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reviews', filter: `reviewee_id=eq.${userId}` },
        (payload) => {
          console.log('Review change:', payload);
          fetchUserAnalytics(); // Refresh analytics when review changes
        }
      )
      .subscribe();
    
    subscriptions.push(reviewsSubscription);

    // Subscribe to reports table for new reports
    const reportsSubscription = supabase
      .channel('analytics-reports')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reports', filter: `reported_user_id=eq.${userId}` },
        (payload) => {
          console.log('Report change:', payload);
          fetchUserAnalytics(); // Refresh analytics when report changes
        }
      )
      .subscribe();
    
    subscriptions.push(reportsSubscription);

    // Subscribe to announcements table for user's rides
    const announcementsSubscription = supabase
      .channel('analytics-announcements')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'announcements', filter: `created_by=eq.${userId}` },
        (payload) => {
          console.log('Announcement change:', payload);
          fetchUserAnalytics(); // Refresh analytics when announcement changes
        }
      )
      .subscribe();
    
    subscriptions.push(announcementsSubscription);

    // Subscribe to announcement_completion_status for completed rides
    const completionSubscription = supabase
      .channel('analytics-completion')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'announcement_completion_status', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Completion change:', payload);
          fetchUserAnalytics(); // Refresh analytics when completion changes
        }
      )
      .subscribe();
    
    subscriptions.push(completionSubscription);

    // Store subscriptions for cleanup
    return subscriptions;
  };

  useEffect(() => {
    const scrollTo = location?.state?.scrollTo;
    if (scrollTo === 'reviews' && reviewsSectionRef.current) {
      setTimeout(() => {
        reviewsSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  }, [location?.state?.scrollTo]);

  const fetchUserAnalytics = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      
      // Use the new API to get rating analytics and reports
      const [ratingResponse, reviewsResponse, completedRidesResponse, reportsResponse] = await Promise.all([
        userAnalyticsAPI.getRatingAnalytics(session.user.id),
        userAnalyticsAPI.getUserReviews(session.user.id, { limit: 10 }),
        userAnalyticsAPI.getCompletedRides(session.user.id, { limit: 50 }),
        reportAPI.getReportsAgainstMe()
      ]);

      const ratingData = ratingResponse.data;
      const reviewsData = reviewsResponse.data?.reviews || [];
      const completedRidesData = completedRidesResponse.data?.rides || [];
      const reportsData = reportsResponse.data || [];

      // Calculate additional stats from completed rides
      const ridesCreated = completedRidesData.filter(ride => ride.role === 'creator').length;
      const ridesJoined = completedRidesData.filter(ride => ride.role === 'participant').length;
      const totalCompleted = completedRidesData.length;

      // Get current month stats
      const currentMonth = new Date().toISOString().slice(0, 7);
      const thisMonthRides = completedRidesData.filter(ride => 
        ride.completed_at?.startsWith(currentMonth)
      );
      const ridesCreatedThisMonth = thisMonthRides.filter(ride => ride.role === 'creator').length;
      const ridesJoinedThisMonth = thisMonthRides.filter(ride => ride.role === 'participant').length;

      setAnalytics({
        profileStats: {
          totalReviews: ratingData.analytics?.total_reviews_received || 0,
          totalReports: ratingData.analytics?.total_reports_received || 0,
          ridesCreated: ridesCreated,
          ridesJoined: ridesJoined,
          ridesCompleted: totalCompleted,
          ridesCancelled: 0 // TODO: Add cancelled rides tracking
        },
        performanceStats: {
          completionRate: totalCompleted > 0 ? 100 : 0, // TODO: Calculate actual completion rate
          joinRate: ridesCreated > 0 ? ((ridesJoined / ridesCreated) * 100).toFixed(1) : 0,
          averageRating: ratingData.analytics?.average_rating || 0,
          totalRatingCount: ratingData.analytics?.total_reviews_received || 0
        },
        activityStats: {
          ridesCreatedThisMonth: ridesCreatedThisMonth,
          ridesJoinedThisMonth: ridesJoinedThisMonth,
          completedRidesThisMonth: thisMonthRides.length,
          reportsThisMonth: 0 // TODO: Add monthly reports tracking
        },
        reviews: reviewsData.map(review => ({
          rating: review.rating,
          feedback: review.feedback,
          createdAt: review.created_at,
          reviewerName: review.reviewer?.name || 'Anonymous'
        })),
        reports: reportsData.map(report => ({
          reason: report.category,
          description: report.description,
          createdAt: report.created_at,
          reporterName: report.reporter?.name || 'Anonymous',
          announcementTitle: report.announcement ? 
            `${report.announcement.start_location_name} → ${report.announcement.destination_name}` : 
            'Unknown Ride'
        })),
        starDistribution: ratingData.analytics?.star_distribution || {
          '5_star': 0,
          '4_star': 0,
          '3_star': 0,
          '2_star': 0,
          '1_star': 0
        }
      });

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: COLORS.textSecondary
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: COLORS.textSecondary
      }}>
        <div style={{ textAlign: 'center' }}>
          <FaExclamationTriangle style={{ fontSize: '3rem', marginBottom: '1rem', color: COLORS.error }} />
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = COLORS.primary, subtitle }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '1.5rem',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color }}><Icon /></div>
      <h3 style={{ 
        color: COLORS.textSecondary, 
        fontSize: '0.9rem',
        fontWeight: '500',
        marginBottom: '0.5rem',
        textTransform: 'uppercase'
      }}>
        {title}
      </h3>
      <div style={{ 
        color: color, 
        fontSize: '2rem',
        fontWeight: 'bold'
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ 
          color: COLORS.textSecondary, 
          fontSize: '0.8rem',
          marginTop: '0.25rem'
        }}>
          {subtitle}
        </div>
      )}
    </motion.div>
  );

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} style={{ color: COLORS.primary }} />
        ))}
        {hasHalfStar && <FaStar style={{ color: COLORS.primary }} />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar key={`empty-${i}`} style={{ color: COLORS.border }} />
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: COLORS.primary,
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Your Analytics
        </h1>
        <p style={{ 
          color: COLORS.textSecondary,
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          Track your travel statistics and performance
        </p>

        {/* Profile Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <h2 style={{ 
            color: COLORS.text, 
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Profile Stats
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <StatCard 
              title="Reviews Received" 
              value={analytics.profileStats.totalReviews} 
              icon={FaStar}
              color="#f59e0b"
            />
            <StatCard 
              title="Reports Against You" 
              value={analytics.profileStats.totalReports} 
              icon={FaExclamationTriangle}
              color="#ef4444"
            />
            <StatCard 
              title="Rides Created" 
              value={analytics.profileStats.ridesCreated} 
              icon={FaRoute}
              color="#3b82f6"
            />
            <StatCard 
              title="Rides Joined" 
              value={analytics.profileStats.ridesJoined} 
              icon={FaUsers}
              color="#10b981"
            />
            <StatCard 
              title="Rides Completed" 
              value={analytics.profileStats.ridesCompleted} 
              icon={FaCheckCircle}
              color="#10b981"
            />
            <StatCard 
              title="Rides Cancelled" 
              value={analytics.profileStats.ridesCancelled} 
              icon={FaUserTimes}
              color="#ef4444"
            />
          </div>
        </motion.div>

        {/* Performance Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <h2 style={{ 
            color: COLORS.text, 
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Performance Stats
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <StatCard 
              title="Completion Rate" 
              value={`${analytics.performanceStats.completionRate}%`} 
              icon={FaChartLine}
              color="#10b981"
              subtitle="Of joined rides"
            />
            <StatCard 
              title="Join Rate" 
              value={`${analytics.performanceStats.joinRate}%`} 
              icon={FaUserCheck}
              color="#3b82f6"
              subtitle="Of your rides"
            />
            <StatCard 
              title="Average Rating" 
              value={analytics.performanceStats.averageRating.toFixed(1)} 
              icon={FaStar}
              color="#f59e0b"
              subtitle={`${analytics.performanceStats.totalRatingCount} ratings`}
            />
            <StatCard 
              title="Total Ratings" 
              value={analytics.performanceStats.totalRatingCount} 
              icon={FaUsers}
              color="#8b5cf6"
            />
          </div>
        </motion.div>

        {/* Monthly Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <h2 style={{ 
            color: COLORS.text, 
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <FaCalendarAlt style={{ marginRight: '0.5rem' }} />
            This Month's Activity
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            <StatCard 
              title="Rides Created" 
              value={analytics.activityStats.ridesCreatedThisMonth} 
              icon={FaRoute}
              color="#3b82f6"
            />
            <StatCard 
              title="Rides Joined" 
              value={analytics.activityStats.ridesJoinedThisMonth} 
              icon={FaUsers}
              color="#10b981"
            />
            <StatCard 
              title="Completed Rides" 
              value={analytics.activityStats.completedRidesThisMonth} 
              icon={FaCheckCircle}
              color="#10b981"
            />
            <StatCard 
              title="Reports" 
              value={analytics.activityStats.reportsThisMonth} 
              icon={FaExclamationTriangle}
              color="#ef4444"
            />
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          ref={reviewsSectionRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <h2 style={{
            color: COLORS.text,
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Your Reviews
          </h2>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              color: COLORS.text,
              fontSize: '2.5rem',
              fontWeight: '900',
              marginBottom: '0.25rem'
            }}>
              ⭐ {analytics.performanceStats.averageRating.toFixed(1)}
            </div>
            <div style={{ color: COLORS.textSecondary, fontSize: '0.95rem' }}>
              Average Rating
            </div>
            <div style={{ marginTop: '0.25rem', color: COLORS.textSecondary, fontSize: '0.95rem' }}>
              {analytics.performanceStats.totalRatingCount} Reviews
            </div>
          </div>

          {/* Star Distribution */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              color: COLORS.text, 
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Rating Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[5, 4, 3, 2, 1].map(stars => {
                const count = analytics.starDistribution[`${stars}_star`] || 0;
                const percentage = analytics.performanceStats.totalRatingCount > 0 
                  ? (count / analytics.performanceStats.totalRatingCount * 100).toFixed(1)
                  : 0;
                
                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      minWidth: '80px'
                    }}>
                      <span style={{ color: COLORS.text, fontWeight: '600' }}>{stars}</span>
                      <FaStar style={{ color: '#f5c400', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ 
                      flex: 1, 
                      height: '8px', 
                      backgroundColor: COLORS.border, 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: '#f5c400',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ 
                      minWidth: '50px', 
                      textAlign: 'right',
                      color: COLORS.textSecondary,
                      fontSize: '0.875rem'
                    }}>
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(!analytics.reviews || analytics.reviews.length === 0) ? (
            <div style={{ textAlign: 'center', color: COLORS.textSecondary }}>
              No reviews yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {analytics.reviews.map((r, idx) => (
                <div
                  key={`${r.reviewerName || 'review'}_${r.createdAt || idx}`}
                  style={{
                    backgroundColor: COLORS.background,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ color: COLORS.text, fontWeight: '800' }}>
                      {r.reviewerName || 'Unknown'}
                    </div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '0.85rem' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar
                        key={s}
                        style={{
                          color: s <= (Number(r.rating) || 0) ? '#f5c400' : COLORS.border
                        }}
                      />
                    ))}
                    <div style={{ marginLeft: '0.5rem', fontWeight: '800', color: COLORS.text }}>
                      {Number(r.rating || 0).toFixed(1)}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', color: COLORS.textSecondary, lineHeight: 1.5 }}>
                    "{r.feedback || ''}"
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Reports Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <h2 style={{
            color: COLORS.text,
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <FaFlag style={{ marginRight: '0.5rem', color: '#ef4444' }} />
            Reports Against You
          </h2>

          {(!analytics.reports || analytics.reports.length === 0) ? (
            <div style={{ textAlign: 'center', color: COLORS.textSecondary }}>
              <FaFlag style={{ fontSize: '3rem', marginBottom: '1rem', color: COLORS.border }} />
              <div>No reports filed against you. Keep up the good work! 🎉</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {analytics.reports.map((report, idx) => (
                <div
                  key={`${report.reporterName || 'report'}_${report.createdAt || idx}`}
                  style={{
                    backgroundColor: COLORS.background,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ color: COLORS.text, fontWeight: '800' }}>
                      {report.reporterName || 'Unknown'}
                    </div>
                    <div style={{ color: COLORS.textSecondary, fontSize: '0.85rem' }}>
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <FaFlag style={{ color: '#ef4444', fontSize: '0.875rem' }} />
                    <div style={{ 
                      marginLeft: '0.5rem', 
                      fontWeight: '600', 
                      color: COLORS.text,
                      textTransform: 'capitalize'
                    }}>
                      {report.reason?.replace('_', ' ') || 'Unknown reason'}
                    </div>
                  </div>

                  {report.description && (
                    <div style={{ marginTop: '0.75rem', color: COLORS.textSecondary, lineHeight: 1.5 }}>
                      "{report.description}"
                    </div>
                  )}

                  <div style={{ marginTop: '0.5rem', color: COLORS.textMuted, fontSize: '0.85rem' }}>
                    Ride: {report.announcementTitle}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Analytics;
