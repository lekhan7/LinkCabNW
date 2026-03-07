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
    
    // Subscribe to review_details table for new reviews
    const reviewsSubscription = supabase
      .channel('analytics-reviews')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'review_details', filter: `reviewee_id=eq.${userId}` },
        (payload) => {
          console.log('Review change:', payload);
          fetchUserAnalytics(); // Refresh analytics when review changes
        }
      )
      .subscribe();
    
    subscriptions.push(reviewsSubscription);

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
      
      // Fetch reviews directly from review_details table
      const { data: reviews, error: reviewsError } = await supabase
        .from('review_details')
        .select(`
          *,
          users!review_details_user_id_fkey (name)
        `)
        .eq('reviewee_id', session.user.id) // Get reviews where current user was reviewed
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Failed to fetch reviews:', reviewsError);
        throw reviewsError;
      }

      // Calculate stats from reviews
      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + r.stars, 0) / totalReviews 
        : 0;

      // Calculate star distribution
      const starDistribution = {
        '5_star': 0,
        '4_star': 0,
        '3_star': 0,
        '2_star': 0,
        '1_star': 0
      };

      reviews?.forEach(review => {
        const starKey = `${review.stars}_star`;
        if (starDistribution[starKey] !== undefined) {
          starDistribution[starKey]++;
        }
      });

      setAnalytics({
        profileStats: {
          totalReviews: totalReviews,
          totalReports: 0, // Not tracking reports separately anymore
          ridesCreated: 0,
          ridesJoined: 0,
          ridesCompleted: 0,
          ridesCancelled: 0
        },
        performanceStats: {
          completionRate: 0,
          joinRate: 0,
          averageRating: averageRating,
          totalRatingCount: totalReviews
        },
        activityStats: {
          ridesCreatedThisMonth: 0,
          ridesJoinedThisMonth: 0,
          completedRidesThisMonth: 0,
          reportsThisMonth: 0
        },
        reviews: reviews?.map(review => ({
          rating: review.stars,
          feedback: review.review_description,
          reportType: review.report_type,
          reportDescription: review.report_description,
          createdAt: review.created_at,
          reviewerName: review.users?.name || 'Anonymous'
        })) || [],
        reports: [], // Not showing reports anymore
        starDistribution
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
          Your Reviews
        </h1>
        <p style={{ 
          color: COLORS.textSecondary,
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          Track your reviews and ratings
        </p>

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

                  {r.reportType && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginBottom: '0.25rem',
                        color: COLORS.text,
                        fontWeight: '600'
                      }}>
                        <FaFlag style={{ color: '#ef4444', fontSize: '0.875rem' }} />
                        Report Type: <span style={{ textTransform: 'capitalize' }}>{r.reportType}</span>
                      </div>
                      {r.reportDescription && (
                        <div style={{ 
                          color: COLORS.textSecondary, 
                          fontSize: '0.875rem',
                          fontStyle: 'italic'
                        }}>
                          "{r.reportDescription}"
                        </div>
                      )}
                    </div>
                  )}
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
