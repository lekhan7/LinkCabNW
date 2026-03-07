import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaStar, FaCommentAlt, FaLightbulb, FaHeart, FaBug } from 'react-icons/fa';
import { COLORS } from '../utils/constants';

const FeedbackModal = ({ isOpen, onClose, onSubmit }) => {
  const [feedbackType, setFeedbackType] = useState('');
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { id: 'compliment', label: 'Compliment', icon: FaHeart, color: '#10b981' },
    { id: 'suggestion', label: 'Suggestion', icon: FaLightbulb, color: '#3b82f6' },
    { id: 'complaint', label: 'Complaint', icon: FaCommentAlt, color: '#f59e0b' },
    { id: 'bug', label: 'Bug Report', icon: FaBug, color: '#ef4444' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackType || !comments.trim()) {
      alert('Please select a feedback type and provide comments');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: feedbackType,
        rating,
        comments: comments.trim()
      });
      onClose();
      // Reset form
      setFeedbackType('');
      setRating(0);
      setComments('');
    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '12px',
          padding: '2rem',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            color: COLORS.text,
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0
          }}>
            Share Your Feedback
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: COLORS.textSecondary,
              padding: '0.5rem'
            }}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Feedback Type Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: COLORS.text,
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Feedback Type
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFeedbackType(type.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: feedbackType === type.id ? type.color : 'transparent',
                      border: `2px solid ${feedbackType === type.id ? type.color : COLORS.border}`,
                      borderRadius: '8px',
                      color: feedbackType === type.id ? COLORS.background : COLORS.text,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    <Icon style={{ fontSize: '1rem' }} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: COLORS.text,
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Overall Rating
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: star <= rating ? '#fbbf24' : COLORS.border,
                    transition: 'all 0.2s'
                  }}
                >
                  <FaStar />
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: COLORS.text,
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Your Comments *
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Please share your detailed feedback..."
              rows={4}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                color: COLORS.text,
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                border: `2px solid ${COLORS.border}`,
                borderRadius: '8px',
                color: COLORS.text,
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !feedbackType || !comments.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isSubmitting || !feedbackType || !comments.trim() ? COLORS.border : COLORS.primary,
                border: 'none',
                borderRadius: '8px',
                color: COLORS.background,
                cursor: isSubmitting || !feedbackType || !comments.trim() ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                opacity: isSubmitting || !feedbackType || !comments.trim() ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;
