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
  const [feedback, setFeedback] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportReasons, setReportReasons] = useState([]);
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReportReasons();
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
      setFeedback('');
      setReportReason('');
      setReportDescription('');
      setShowReportOptions(false);
    }
  }, [isOpen, reviewableUsers]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 ReviewModal state debug:', {
      rating,
      reportReason,
      selectedUser: selectedUser?.name,
      showReportOptions
    });
  }, [rating, reportReason, selectedUser, showReportOptions]);

  const fetchReportReasons = async () => {
    try {
      const response = await reportAPI.getReasons();
      setReportReasons(response.data || []);
    } catch (error) {
      console.error('Failed to fetch report reasons:', error);
    }
  };

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
        feedback
      });
      
      await onSubmitReview({
        announcementId,
        revieweeId: selectedUser.id,
        rating,
        feedback
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
        setFeedback('');
        setReportReason('');
        setReportDescription('');
        setShowReportOptions(false);
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

  const handleSubmitReport = async () => {
    console.log('🔍 Report validation check:', {
      selectedUser: selectedUser,
      reportReason: reportReason,
      reportReasonType: typeof reportReason,
      reportReasonTrimmed: reportReason?.trim()
    });
    
    if (!selectedUser) {
      alert('Please select a user to report');
      return;
    }
    
    if (!reportReason || reportReason.trim() === '') {
      alert('Please select a reason for the report');
      return;
    }

    setSubmittingReport(true);
    
    try {
      console.log('🔍 Submitting report:', {
        announcementId,
        reportedUserId: selectedUser.id,
        reportedUserName: selectedUser.name,
        reason: reportReason,
        description: reportDescription
      });
      
      await reportAPI.submit({
        announcementId,
        reportedUserId: selectedUser.id,
        reason: reportReason,
        description: reportDescription
      });
      
      console.log('✅ Report submitted successfully');
      alert('Report submitted successfully');
      setReportReason('');
      setReportDescription('');
      setShowReportOptions(false);
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      alert(`Failed to submit report: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmittingReport(false);
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
            DEBUG: Rating={rating}, Reason="{reportReason}", User={selectedUser?.name}
          </div>

          {/* Progress Indicator */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: COLORS.textMuted
          }}>
            Reviewing {reviewableUsers.indexOf(selectedUser) + 1} of {reviewableUsers.length}
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
                  setFeedback('');
                  setReportReason('');
                  setReportDescription('');
                  setShowReportOptions(false);
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
                      {userData.name}
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
                color: COLORS.textMuted 
              }}>
                {selectedUser.completion_type}
              </div>
              {selectedUser.average_rating && (
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: COLORS.textMuted,
                  marginTop: '0.25rem'
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

          {/* Feedback */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: COLORS.text,
              marginBottom: '0.5rem' 
            }}>
              Additional feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
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

          {/* Report Options */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowReportOptions(!showReportOptions)}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaExclamationTriangle />
              {showReportOptions ? 'Hide Report Options' : 'Report an Issue'}
            </button>

            {showReportOptions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '0.5rem'
                }}
              >

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#92400e',
                    marginBottom: '0.5rem' 
                  }}>
                    Report an Issue (optional)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {reportReasons.map(reason => (
                      <label key={reason.value} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: reportReason === reason.value ? '#fef3c7' : 'transparent',
                        border: reportReason === reason.value ? '1px solid #f59e0b' : '1px solid #d1d5db'
                      }}>
                        <input
                          type="radio"
                          name="reportReason"
                          value={reason.value}
                          checked={reportReason === reason.value}
                          onChange={(e) => {
                            console.log('🚨 Report reason selected:', e.target.value);
                            setReportReason(e.target.value);
                          }}
                          style={{ margin: 0 }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {reason.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {reportReason && (
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#92400e',
                        marginBottom: '0.5rem' 
                      }}>
                        Describe the issue
                      </label>
                      <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Please provide details about the issue..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #f59e0b',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          minHeight: '80px',
                          resize: 'vertical',
                          backgroundColor: '#fff'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSubmitReport}
                        disabled={submittingReport || !reportReason}
                        style={{
                          marginTop: '1rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: submittingReport || !reportReason ? '#d1d5db' : '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: submittingReport || !reportReason ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {submittingReport ? 'Submitting...' : 'Submit Report'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
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
                const remainingUsers = reviewableUsers.filter(u => u.id !== selectedUser.id);
                if (remainingUsers.length > 0) {
                  setSelectedUser(remainingUsers[0]);
                  setRating(0);
                  setFeedback('');
                  setReportReason('');
                  setReportDescription('');
                  setShowReportOptions(false);
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
