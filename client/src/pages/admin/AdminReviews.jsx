import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';
import { FaStar, FaEye, FaTrash, FaUser, FaCalendarAlt, FaFlag } from 'react-icons/fa';
import { config } from '../../config/env';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      console.log('Fetching reviews from admin API...');
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${config.apiBaseUrl}/admin/reviews`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('Fetched reviews count:', result.data?.length || 0);
      console.log('Sample review data:', result.data?.[0]);
      
      setReviews(result.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      console.error('Reviews fetch error:', error);
      
      // Fallback to direct Supabase query if API fails
      try {
        console.log('Attempting fallback to direct Supabase query...');
        const { data, error } = await supabase
          .from('review_details')
          .select(`
            *,
            reviewer:users!review_details_user_id_fkey(id, name, email),
            reviewee:users!review_details_reviewee_id_fkey(id, name, email),
            announcement:announcements(id, start_location_name, destination_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Fallback fetched reviews count:', data?.length || 0);
        setReviews(data || []);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        setReviews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.reviewer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === 'all' || review.stars === parseInt(ratingFilter);
    
    return matchesSearch && matchesRating;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#10B981';
    if (rating >= 3) return '#F59E0B';
    return '#EF4444';
  };

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
          <p style={{ color: COLORS.text }}>Loading reviews...</p>
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
            Reviews Management
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                width: '250px',
              }}
            />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              {filteredReviews.length} reviews
            </span>
          </div>
        </div>

        {/* Reviews Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Reviewer</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Reviewed User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Rating</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Feedback</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Route</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review, index) => (
                  <motion.tr
                    key={review.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', color: COLORS.text, margin: '0.25rem 0' }}>
                          {review.reviewer?.username || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0' }}>
                          {review.reviewer?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', color: COLORS.text, margin: '0.25rem 0' }}>
                          {review.reviewed_user?.username || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0' }}>
                          {review.reviewed_user?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          backgroundColor: getRatingColor(review.stars) + '20',
                          color: getRatingColor(review.stars),
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                        }}>
                          {review.stars}
                        </span>
                        <span style={{ fontSize: '1rem' }}>
                          {renderStars(review.stars)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: COLORS.text, 
                        maxWidth: '300px',
                        lineHeight: '1.4'
                      }}>
                        {review.review_description || 'No feedback provided'}
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: COLORS.text }}>
                        {review.announcement ? (
                          <>
                            <div>{review.announcement.from_location}</div>
                            <div>→ {review.announcement.to_location}</div>
                          </>
                        ) : (
                          <span style={{ color: '#6B7280' }}>N/A</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {formatDate(review.created_at)}
                      </p>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminReviews;
