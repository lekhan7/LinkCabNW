import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { FaRoute, FaUserCheck, FaStar, FaFlag, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';

const AnalyticsNew = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalRidesCreated: 0,
    totalRidesJoined: 0,
    totalReviewsReceived: 0,
    totalReportsReceived: 0
  });
  const [reviewsByAnnouncement, setReviewsByAnnouncement] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboardData();
      fetchReviewsByAnnouncement();
    } else {
      setLoading(false);
      setError('Authentication required');
    }
  }, [isAuthenticated, token]);

  const fetchDashboardData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/user-analytics-new/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewsByAnnouncement = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/user-analytics-new/reviews-by-announcement', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setReviewsByAnnouncement(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch reviews by announcement');
      }
    } catch (error) {
      console.error('Failed to fetch reviews by announcement:', error);
    }
  };

  const handleReviewClick = (review, announcement) => {
    setSelectedReview({
      ...review,
      announcement: announcement
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReview(null);
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
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
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
    return (
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            style={{
              color: star <= rating ? '#f5c400' : COLORS.border,
              fontSize: '0.875rem'
            }}
          />
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
          Analytics Dashboard
        </h1>
        <p style={{ 
          color: COLORS.textSecondary,
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          Track your ride statistics and reviews
        </p>

        {/* TASK 4: 4 Statistics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {/* Card 1: Total Rides Created */}
          <StatCard
            title="Total Rides Created"
            value={dashboardData.totalRidesCreated}
            icon={FaRoute}
            color={COLORS.primary}
          />

          {/* Card 2: Total Rides Joined */}
          <StatCard
            title="Total Rides Joined"
            value={dashboardData.totalRidesJoined}
            icon={FaUserCheck}
            color={COLORS.success}
          />

          {/* Card 3: Total Reviews Received */}
          <StatCard
            title="Total Reviews Received"
            value={dashboardData.totalReviewsReceived}
            icon={FaStar}
            color={COLORS.warning}
          />

          {/* Card 4: Total Reports Received */}
          <StatCard
            title="Total Reports Received"
            value={dashboardData.totalReportsReceived}
            icon={FaFlag}
            color={COLORS.error}
          />
          
          
        </div>

        {/* TASK 9: Reviews for Your Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem'
          }}
        >
          <h2 style={{
            color: COLORS.text,
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Reviews for Your Announcements
          </h2>

          {Object.keys(reviewsByAnnouncement).length === 0 ? (
            <div style={{ textAlign: 'center', color: COLORS.textSecondary, padding: '2rem' }}>
              No reviews yet for your announcements.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {Object.entries(reviewsByAnnouncement).map(([announcementId, data]) => (
                <div key={announcementId}>
                  {/* Announcement Title */}
                  <div style={{
                    backgroundColor: COLORS.background,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      color: COLORS.text,
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      {data.announcement?.start_location_name} → {data.announcement?.destination_name}
                    </h3>
                    <div style={{ 
                      color: COLORS.textSecondary, 
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FaCalendarAlt />
                      {data.announcement?.date} at {data.announcement?.time}
                    </div>
                  </div>

                  {/* Reviews for this announcement */}
                  <div style={{ display: 'grid', gap: '1rem', marginLeft: '1rem' }}>
                    {data.reviews.map((review, index) => (
                      <div
                        key={index}
                        onClick={() => handleReviewClick(review, data.announcement)}
                        style={{
                          backgroundColor: COLORS.background,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '8px',
                          padding: '1rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                        }}
                      >
                        {/* TASK 10: Review Display Format */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ 
                              color: COLORS.text, 
                              fontWeight: '600',
                              fontSize: '1rem',
                              marginBottom: '0.25rem'
                            }}>
                              {review.reviewerName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {renderStars(review.starsGiven)}
                              <span style={{ 
                                color: COLORS.textSecondary,
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}>
                                {review.starsGiven}.0
                              </span>
                            </div>
                          </div>
                          <div style={{ 
                            color: COLORS.textSecondary, 
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap'
                          }}>
                            {new Date(review.dateOfReview).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Review Description */}
                        {review.reviewDescription && (
                          <div style={{ 
                            color: COLORS.textSecondary,
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                            marginBottom: '0.75rem',
                            fontStyle: 'italic'
                          }}>
                            "{review.reviewDescription}"
                          </div>
                        )}

                        {/* Report Type and Description (if available) */}
                        {review.reportType && (
                          <div style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '0.75rem'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              marginBottom: '0.25rem',
                              color: COLORS.text,
                              fontWeight: '600',
                              fontSize: '0.875rem'
                            }}>
                              <FaFlag style={{ color: COLORS.error }} />
                              Report Type: <span style={{ textTransform: 'capitalize' }}>{review.reportType}</span>
                            </div>
                            {review.reportDescription && (
                              <div style={{ 
                                color: COLORS.textSecondary,
                                fontSize: '0.8rem',
                                lineHeight: 1.4
                              }}>
                                "{review.reportDescription}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Review Details Modal */}
        {isModalOpen && selectedReview && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{
                  color: COLORS.text,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  margin: 0
                }}>
                  Review Details
                </h3>
                <button
                  onClick={closeModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: COLORS.textSecondary,
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.background;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ×
                </button>
              </div>

              {/* Announcement Info */}
              <div style={{
                backgroundColor: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{
                  color: COLORS.text,
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  {selectedReview.announcement?.start_location_name} → {selectedReview.announcement?.destination_name}
                </h4>
                <div style={{ 
                  color: COLORS.textSecondary, 
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaCalendarAlt />
                  {selectedReview.announcement?.date} at {selectedReview.announcement?.time}
                </div>
              </div>

              {/* Reviewer Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  color: COLORS.text,
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  {selectedReview.reviewerName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {renderStars(selectedReview.starsGiven)}
                  <span style={{ 
                    color: COLORS.textSecondary,
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    {selectedReview.starsGiven}.0
                  </span>
                </div>
              </div>

              {/* Review Description */}
              {selectedReview.reviewDescription && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    color: COLORS.text,
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem'
                  }}>
                    Review
                  </h4>
                  <div style={{
                    backgroundColor: COLORS.background,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    color: COLORS.textSecondary,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    fontStyle: 'italic'
                  }}>
                    "{selectedReview.reviewDescription}"
                  </div>
                </div>
              )}

              {/* Report Details */}
              {selectedReview.reportType && (
                <div>
                  <h4 style={{
                    color: COLORS.text,
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem'
                  }}>
                    Report Details
                  </h4>
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      color: COLORS.text,
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      <FaFlag style={{ color: COLORS.error }} />
                      Report Type: <span style={{ textTransform: 'capitalize' }}>{selectedReview.reportType}</span>
                    </div>
                    {selectedReview.reportDescription && (
                      <div style={{ 
                        color: COLORS.textSecondary,
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                      }}>
                        "{selectedReview.reportDescription}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Date */}
              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${COLORS.border}`,
                color: COLORS.textSecondary,
                fontSize: '0.8rem',
                textAlign: 'center'
              }}>
                Reviewed on {new Date(selectedReview.dateOfReview).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </motion.div>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default AnalyticsNew;
