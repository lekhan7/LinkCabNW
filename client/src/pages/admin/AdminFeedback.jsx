import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';
import { config } from '../../config/env';
import { FaStar, FaComment, FaExclamationTriangle, FaLightbulb, FaBug, FaHeart, FaTrash, FaReply, FaCheck, FaTimes, FaFilter, FaSearch } from 'react-icons/fa';

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, [searchTerm, filterType, filterStatus]);

  const fetchFeedback = async () => {
    try {
      console.log('Fetching feedback from admin API...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session');
      }
      
      const token = session?.access_token;
      if (!token) {
        throw new Error('No authentication token found');
      }

      const queryParams = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { type: filterType }),
        ...(filterStatus && { status: filterStatus })
      });

      const response = await fetch(`${config.apiBaseUrl}/feedback?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Failed to refresh token: ' + refreshError.message);
        }
        
        if (!refreshedSession?.access_token) {
          throw new Error('No access token after refresh');
        }
        
        const retryResponse = await fetch(`${config.apiBaseUrl}/feedback?${queryParams}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${refreshedSession.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
        }

        const result = await retryResponse.json();
        setFeedback(result.data || []);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Full API Response:', result);
      console.log('🔍 Response data length:', result.data?.length || 0);
      console.log('🔍 Response success:', result.success);
      console.log('🔍 Response message:', result.message);
      console.log('Fetched feedback count:', result.data?.length || 0);
      setFeedback(result.data || []);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      
      try {
        console.log('Attempting fallback to direct Supabase query...');
        const { data, error } = await supabase
          .from('feedback')
          .select(`
            *,
            user:users!feedback_user_id_fkey(name, phone_number, email)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFeedback(data || []);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        setFeedback([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackAction = async (feedbackId, action) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error('Failed to get session');
      
      const token = session?.access_token;
      if (!token) throw new Error('No authentication token found');

      let response;
      
      switch (action) {
        case 'delete':
          response = await fetch(`${config.apiBaseUrl}/feedback/${feedbackId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          break;
        
        case 'respond':
          response = await fetch(`${config.apiBaseUrl}/feedback/${feedbackId}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              status: 'reviewed',
              admin_response: adminResponse 
            })
          });
          break;
        
        case 'resolve':
          response = await fetch(`${config.apiBaseUrl}/feedback/${feedbackId}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              status: 'resolved',
              admin_response: adminResponse 
            })
          });
          break;
        
        case 'dismiss':
          response = await fetch(`${config.apiBaseUrl}/feedback/${feedbackId}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              status: 'dismissed',
              admin_response: adminResponse 
            })
          });
          break;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      await fetchFeedback();
      setShowConfirmModal(false);
      setShowDetailsModal(false);
      setAdminResponse('');
    } catch (error) {
      console.error('Failed to perform feedback action:', error);
    }
  };

  const getFeedbackIcon = (type) => {
    switch (type) {
      case 'compliment': return <FaHeart color="#10b981" />;
      case 'complaint': return <FaExclamationTriangle color="#ef4444" />;
      case 'suggestion': return <FaLightbulb color="#3b82f6" />;
      case 'bug_report': return <FaBug color="#f59e0b" />;
      default: return <FaComment color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'reviewed': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'dismissed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = !searchTerm || 
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || item.feedback_type === filterType;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `4px solid ${COLORS.border}`,
          borderTop: `4px solid ${COLORS.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem',
        }} />
        <p style={{ color: COLORS.text }}>Loading feedback...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2rem' }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: COLORS.text, marginBottom: '1rem' }}>Feedback Management</h2>
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: COLORS.textSecondary 
              }} />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  backgroundColor: COLORS.background,
                  color: COLORS.text
                }}
              />
            </div>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              backgroundColor: COLORS.background,
              color: COLORS.text
            }}
          >
            <option value="">All Types</option>
            <option value="compliment">Compliment</option>
            <option value="complaint">Complaint</option>
            <option value="suggestion">Suggestion</option>
            <option value="bug_report">Bug Report</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              backgroundColor: COLORS.background,
              color: COLORS.text
            }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {filteredFeedback.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: COLORS.text }}>No feedback found</p>
        </div>
      ) : (
        <div>
          {filteredFeedback.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {getFeedbackIcon(item.feedback_type)}
                    <h4 style={{ color: COLORS.text, margin: 0 }}>{item.subject}</h4>
                  </div>
                  <p style={{ color: COLORS.textSecondary, margin: 0, fontSize: '0.9rem' }}>
                    {item.user?.name || 'Anonymous'} • {item.user?.email || 'No email'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {item.rating && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <FaStar 
                          key={i} 
                          color={i < item.rating ? '#fbbf24' : '#d1d5db'} 
                          size={16}
                        />
                      ))}
                    </div>
                  )}
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getStatusColor(item.status),
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    {item.status}
                  </span>
                </div>
              </div>
              
              <p style={{ color: COLORS.text, margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                {item.message}
              </p>
              
              {item.admin_response && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #0284c7',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{ color: '#0284c7', margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
                    Admin Response:
                  </p>
                  <p style={{ color: COLORS.text, margin: 0 }}>{item.admin_response}</p>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '0.8rem',
                color: COLORS.textSecondary
              }}>
                <span>
                  Priority: <strong>{item.priority}</strong> • Type: <strong>{item.feedback_type.replace('_', ' ')}</strong>
                </span>
                <span>
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginTop: '1rem' 
              }}>
                <button
                  onClick={() => {
                    setSelectedFeedback(item);
                    setShowDetailsModal(true);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: COLORS.primary,
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  View Details
                </button>
                
                {item.status !== 'resolved' && item.status !== 'dismissed' && (
                  <button
                    onClick={() => {
                      setSelectedFeedback(item);
                      setActionType('resolve');
                      setShowConfirmModal(true);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <FaCheck /> Resolve
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setSelectedFeedback(item);
                    setActionType('delete');
                    setShowConfirmModal(true);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Details Modal */}
      {showDetailsModal && selectedFeedback && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: COLORS.background,
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: COLORS.text, margin: 0 }}>Feedback Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: COLORS.textSecondary
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {getFeedbackIcon(selectedFeedback.feedback_type)}
                <h4 style={{ color: COLORS.text, margin: 0 }}>{selectedFeedback.subject}</h4>
              </div>
              <p style={{ color: COLORS.textSecondary, margin: 0, fontSize: '0.9rem' }}>
                {selectedFeedback.user?.name || 'Anonymous'} • {selectedFeedback.user?.email || 'No email'}
              </p>
            </div>
            
            {selectedFeedback.rating && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: COLORS.text, margin: '0 0 0.5rem 0' }}>Rating:</p>
                <div>
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      color={i < selectedFeedback.rating ? '#fbbf24' : '#d1d5db'} 
                      size={20}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: COLORS.text, margin: '0 0 0.5rem 0' }}>Message:</p>
              <p style={{ color: COLORS.text, margin: 0, lineHeight: '1.5' }}>{selectedFeedback.message}</p>
            </div>
            
            {selectedFeedback.admin_response && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: COLORS.text, margin: '0 0 0.5rem 0' }}>Admin Response:</p>
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #0284c7',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <p style={{ color: COLORS.text, margin: 0 }}>{selectedFeedback.admin_response}</p>
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: COLORS.text, margin: '0 0 0.5rem 0' }}>Admin Response:</p>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Enter your response..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  backgroundColor: COLORS.background,
                  color: COLORS.text,
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: COLORS.text,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActionType('respond');
                  setShowConfirmModal(true);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: COLORS.primary,
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Submit Response
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmModal && selectedFeedback && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: COLORS.background,
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <h3 style={{ color: COLORS.text, margin: '0 0 1rem 0' }}>
              {actionType === 'delete' ? 'Delete Feedback' : 
               actionType === 'resolve' ? 'Resolve Feedback' : 
               'Submit Response'}
            </h3>
            
            <p style={{ color: COLORS.text, margin: '0 0 1.5rem 0' }}>
              {actionType === 'delete' ? 
                'Are you sure you want to delete this feedback? This action cannot be undone.' :
                actionType === 'resolve' ? 
                'Are you sure you want to mark this feedback as resolved?' :
                'Are you sure you want to submit this response?'}
            </p>
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: COLORS.text,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleFeedbackAction(selectedFeedback.id, actionType)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: actionType === 'delete' ? '#ef4444' : '#10b981',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                {actionType === 'delete' ? 'Delete' : 
                 actionType === 'resolve' ? 'Resolve' : 
                 'Submit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminFeedback;
