import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:users(username),
          recipient:users(username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications');
      console.error('Notifications fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.sender?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.recipient?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'ride_request': return '#3B82F6';
      case 'ride_accepted': return '#10B981';
      case 'ride_rejected': return '#EF4444';
      case 'announcement': return '#F59E0B';
      case 'system': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'read': return '#10B981';
      case 'unread': return '#F59E0B';
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
          <p style={{ color: COLORS.text }}>Loading notifications...</p>
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
            Notifications Management
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search notifications..."
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Types</option>
              <option value="ride_request">Ride Request</option>
              <option value="ride_accepted">Ride Accepted</option>
              <option value="ride_rejected">Ride Rejected</option>
              <option value="announcement">Announcement</option>
              <option value="system">System</option>
            </select>
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
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
            <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              {filteredNotifications.length} notifications
            </span>
          </div>
        </div>

        {/* Notifications Table */}
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
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Title</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Sender</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Recipient</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((notification, index) => (
                  <motion.tr
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', color: COLORS.text, margin: '0.25rem 0' }}>
                          {notification.title}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0' }}>
                          {notification.message?.substring(0, 100)}...
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: COLORS.text }}>
                        {notification.sender?.username || 'System'}
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: COLORS.text }}>
                        {notification.recipient?.username || 'Unknown'}
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: getTypeColor(notification.type) + '20',
                        color: getTypeColor(notification.type),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}>
                        {notification.type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: getStatusColor(notification.status) + '20',
                        color: getStatusColor(notification.status),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}>
                        {notification.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {formatDate(notification.created_at)}
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

export default AdminNotifications;
