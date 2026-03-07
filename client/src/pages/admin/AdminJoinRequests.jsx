import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';

const AdminJoinRequests = () => {
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchJoinRequests();
  }, []);

  const fetchJoinRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('join_requests')
        .select(`
          *,
          passenger:users(username, email),
          announcement:announcements(from_location, to_location, creator:users(username))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJoinRequests(data || []);
    } catch (error) {
      console.error('Failed to fetch join requests');
      console.error('Join requests fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJoinRequests = joinRequests.filter(request => {
    const matchesSearch = 
      request.passenger?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.announcement?.from_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.announcement?.to_location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
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
          <p style={{ color: COLORS.text }}>Loading join requests...</p>
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
            Join Requests Management
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search requests..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              {filteredJoinRequests.length} requests
            </span>
          </div>
        </div>

        {/* Join Requests Table */}
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
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Passenger</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Route</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Creator</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Message</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredJoinRequests.map((request, index) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', color: COLORS.text, margin: '0.25rem 0' }}>
                          {request.passenger?.username || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0' }}>
                          {request.passenger?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: COLORS.text }}>
                        <div>{request.announcement?.from_location}</div>
                        <div>→ {request.announcement?.to_location}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: COLORS.text }}>
                        {request.announcement?.creator?.username || 'Unknown'}
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: getStatusColor(request.status) + '20',
                        color: getStatusColor(request.status),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                      }}>
                        {request.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: COLORS.text, 
                        maxWidth: '200px',
                        lineHeight: '1.4'
                      }}>
                        {request.message?.substring(0, 100)}...
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {formatDate(request.created_at)}
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

export default AdminJoinRequests;
