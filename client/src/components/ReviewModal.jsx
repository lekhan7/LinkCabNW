import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { COLORS } from '../utils/constants';
import { reviewAPI, reportAPI } from '../services/api';

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  announcementId, 
  reviewableUsers, 
  onSubmitReview,
  currentUser 
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewDescription, setReviewDescription] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      console.log('🔍 ReviewModal opening with reviewableUsers:', reviewableUsers);
      if (reviewableUsers && reviewableUsers.length > 0) {
        const firstUser = reviewableUsers[0];
        // Handle both direct user object and nested user structure
        const userToSelect = firstUser.users || firstUser;
        console.log('👤 Auto-selecting first user:', userToSelect);
        setSelectedUser(userToSelect);
      } else {
        console.log('⚠️ No reviewable users available');
        setSelectedUser(null);
      }
      setRating(0);
      setReviewDescription('');
      setReportType('');
      setReportDescription('');
    }
  }, [isOpen, reviewableUsers]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 ReviewModal state debug:', {
      rating,
      reportType,
      selectedUser: selectedUser?.name
    });
  }, [rating, reportType, selectedUser]);


  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    console.log('🔍 Review validation check:', {
      selectedUser: selectedUser,
      rating: rating,
      ratingType: typeof rating,
      ratingValue: parseInt(rating),
      reviewableUsersLength: reviewableUsers.length
    });
    
    if (!selectedUser || !selectedUser.id) {
      console.error('❌ No user selected for review');
      alert('Please select a user to review');
      return;
    }
    
    if (!rating || rating === 0 || parseInt(rating) === 0) {
      console.error('❌ No rating selected');
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔍 Submitting review:', {
        announcementId,
        revieweeId: selectedUser.id,
        revieweeName: selectedUser.name,
        rating,
        reviewDescription,
        reportType,
        reportDescription
      });
      
      await onSubmitReview({
        announcementId,
        revieweeId: selectedUser.id,
        rating,
        reviewDescription,
        reportType,
        reportDescription
      });
      
      console.log('✅ Review submitted successfully');
      
      // Reset form for next user
      const remainingUsers = reviewableUsers.filter(u => {
        const userData = u.users || u;
        return userData.id !== selectedUser.id;
      });
      
      console.log('🔄 Remaining users after review:', remainingUsers.length);
      
      if (remainingUsers.length > 0) {
        const nextUser = remainingUsers[0];
        const nextUserData = nextUser.users || nextUser;
        console.log('👤 Auto-selecting next user:', nextUserData);
        setSelectedUser(nextUserData);
        setRating(0);
        setReviewDescription('');
        setReportType('');
        setReportDescription('');
      } else {
        console.log('🎉 All users reviewed, closing modal');
        onClose();
      }
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      alert(`Failed to submit review: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };


  const StarRating = ({ value, onChange, size = '2rem' }) => {
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              console.log('⭐ Star clicked:', star);
              onChange(star);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: size,
              color: star <= value ? '#fbbf24' : '#d1d5db',
              transition: 'color 0.2s'
            }}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: COLORS.textMuted
            }}
          >
            <FaTimes />
          </button>

          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: COLORS.text,
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Review: {selectedUser?.name || 'this User'}
          </h2>

          {/* Debug Info - Remove in production */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '1rem',
            fontSize: '0.75rem',
            color: '#666',
            backgroundColor: '#f5f5f5',
            padding: '0.5rem',
            borderRadius: '0.25rem'
          }}>
            DEBUG: Rating={rating}, Report Type="{reportType}", User={selectedUser?.name}
          </div>

          {/* Progress Indicator */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: COLORS.textMuted
          }}>
            Reviewing {reviewableUsers.indexOf(reviewableUsers.find(u => {
              const userData = u.users || u;
              return userData.id === selectedUser?.id;
            })) + 1} of {reviewableUsers.length} {reviewableUsers.length === 1 ? 'person' : 'people'}
          </div>

          {/* No Users Message */}
          {reviewableUsers.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '0.5rem',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: COLORS.text,
                marginBottom: '0.5rem'
              }}>
                No Users to Review
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: COLORS.textMuted 
              }}>
                There are no participants available to review for this ride.
              </div>
              <button
                onClick={onClose}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: COLORS.primary,
                  color: '#000',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          )}

          {/* User Selection and Review Form */}
          {reviewableUsers.length > 0 && (
            <div>
              {/* User Selection */}
              {reviewableUsers.length > 1 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: COLORS.text,
                marginBottom: '0.5rem' 
              }}>
                Select person to review:
              </label>
              <select
                value={selectedUser?.id || ''}
                onChange={(e) => {
                  const user = reviewableUsers.find(u => {
                    const userData = u.users || u;
                    return userData.id === e.target.value;
                  });
                  const userData = user?.users || user;
                  setSelectedUser(userData);
                  setRating(0);
                  setReviewDescription('');
                  setReportType('');
                  setReportDescription('');
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  backgroundColor: COLORS.surface
                }}
                required
              >
                {reviewableUsers.map(user => {
                  const userData = user.users || user;
                  return (
                    <option key={userData.id} value={userData.id}>
                      {userData.name} ({user.is_creator ? 'Ride Creator' : 'Co-Passenger'})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Single User Display */}
          {reviewableUsers.length === 1 && selectedUser && (
            <div style={{ 
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: COLORS.surfaceLight,
              borderRadius: '0.5rem',
              textAlign: 'center',
              border: `2px solid ${COLORS.primary}`
            }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: COLORS.primary,
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>
                Person You're Reviewing
              </div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: COLORS.text,
                marginBottom: '0.25rem'
              }}>
                {selectedUser.name}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: COLORS.textMuted,
                marginBottom: '0.5rem'
              }}>
                {selectedUser.completion_type || 'Passenger'}
              </div>
              {/* Show role indicator */}
              <div style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: selectedUser.is_creator ? COLORS.success : COLORS.primary,
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                {selectedUser.is_creator ? 'Ride Creator' : 'Co-Passenger'}
              </div>
              {selectedUser.average_rating && (
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: COLORS.textMuted,
                  marginTop: '0.5rem'
                }}>
                  Current Rating: ⭐ {selectedUser.average_rating.toFixed(1)}
                </div>
              )}
            </div>
          )}

          {/* Rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: COLORS.text,
              marginBottom: '0.5rem' 
            }}>
              How was your experience? *
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <StarRating value={rating} onChange={setRating} />
            </div>
            {rating > 0 && (
              <div style={{ 
                textAlign: 'center', 
                fontSize: '0.875rem', 
                color: COLORS.textMuted 
              }}>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </div>
            )}
          </div>

          {/* Review Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: COLORS.text,
              marginBottom: '0.5rem' 
            }}>
              Review Description (optional)
            </label>
            <textarea
              value={reviewDescription}
              onChange={(e) => setReviewDescription(e.target.value)}
              placeholder="Share your experience..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                minHeight: '100px',
                resize: 'vertical',
                backgroundColor: COLORS.surface
              }}
            />
          </div>

          {/* Report Issue Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: COLORS.text,
              marginBottom: '0.5rem' 
            }}>
              Report Issue (optional)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { value: 'Driver Behavior', label: 'Driver Behavior' },
                { value: 'Vehicle Condition', label: 'Vehicle Condition' },
                { value: 'Late Arrival', label: 'Late Arrival' },
                { value: 'Route Issue', label: 'Route Issue' },
                { value: 'Other', label: 'Other' }
              ].map(type => (
                <label key={type.value} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: reportType === type.value ? COLORS.surfaceLight : 'transparent',
                  border: reportType === type.value ? `1px solid ${COLORS.primary}` : '1px solid #d1d5db'
                }}>
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportType === type.value}
                    onChange={(e) => {
                      console.log('🚨 Report type selected:', e.target.value);
                      setReportType(e.target.value);
                    }}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '0.875rem', color: COLORS.text }}>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
            
            {reportType && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: COLORS.text,
                  marginBottom: '0.5rem' 
                }}>
                  Report Description
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide details about the issue..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical',
                    backgroundColor: COLORS.surface
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button
              type="button"
              onClick={() => {
                const remainingUsers = reviewableUsers.filter(u => {
                  const userData = u.users || u;
                  return userData.id !== selectedUser.id;
                });
                if (remainingUsers.length > 0) {
                  const nextUser = remainingUsers[0];
                  const nextUserData = nextUser.users || nextUser;
                  setSelectedUser(nextUserData);
                  setRating(0);
                  setReviewDescription('');
                  setReportType('');
                  setReportDescription('');
                } else {
                  onClose();
                }
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: COLORS.surfaceLight,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {reviewableUsers.length > 1 ? 'Skip User' : 'Skip'}
            </button>
            <button
              type="submit"
              onClick={handleSubmitReview}
              disabled={loading || rating === 0}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: (loading || rating === 0) ? COLORS.textMuted : COLORS.primary,
                color: '#000',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: (loading || rating === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
