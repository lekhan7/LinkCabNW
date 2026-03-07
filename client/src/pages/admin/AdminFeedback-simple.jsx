import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';
import { FaStar } from 'react-icons/fa';

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      
      // Simple token check - get from localStorage directly
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to access admin features');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/feedback?page=1&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedback(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading feedback...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button 
          onClick={() => window.location.href = '/login'}
          style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem',
            backgroundColor: COLORS.primary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ color: COLORS.text, marginBottom: '2rem' }}>Admin Feedback Management</h2>
      
      {feedback.length === 0 ? (
        <p style={{ color: COLORS.text }}>No feedback submissions yet.</p>
      ) : (
        <div>
          <p style={{ color: COLORS.text, marginBottom: '1rem' }}>
            Total Feedback: {feedback.length}
          </p>
          {feedback.map((item) => (
            <div 
              key={item.id}
              style={{
                backgroundColor: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <h4 style={{ color: COLORS.text, margin: '0 0 0.5rem 0' }}>
                {item.subject}
              </h4>
              <p style={{ color: COLORS.text, margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                Type: {item.feedback_type} | Status: {item.status} | Priority: {item.priority}
              </p>
              <p style={{ color: COLORS.text, margin: '0 0 0.5rem 0' }}>
                {item.message}
              </p>
              {item.rating && (
                <p style={{ color: COLORS.text, margin: '0 0 0.5rem 0' }}>
                  Rating: <span style={{ display: 'inline-flex', alignItems: 'center' }}>{renderStars(item.rating)}</span>
                </p>
              )}
              <p style={{ color: COLORS.text, margin: '0', fontSize: '0.8rem' }}>
                Created: {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
