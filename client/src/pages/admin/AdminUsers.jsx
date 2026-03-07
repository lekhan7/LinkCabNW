import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';
import { FaPhone, FaEnvelope, FaCar, FaChartBar, FaStar, FaEye, FaBan, FaCheck, FaTrash, FaUserShield, FaUser } from 'react-icons/fa';
import { config } from '../../config/env';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from admin API...');
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${config.apiBaseUrl}/admin/users`, {
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
      
      console.log('Fetched users count:', result.data?.length || 0);
      console.log('Sample user data:', result.data?.[0]);
      
      setUsers(result.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      console.error('Users fetch error:', error);
      
      // Fallback to direct Supabase query if API fails
      try {
        console.log('Attempting fallback to direct Supabase query...');
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            phone_number,
            verified,
            is_phone_verified,
            is_online,
            average_rating,
            completed_trips,
            total_trips,
            role,
            is_premium,
            created_at,
            updated_at,
            last_active,
            profile_picture,
            code_number
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Fallback fetched users count:', data?.length || 0);
        setUsers(data || []);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      let response;
      
      switch (action) {
        case 'suspend':
          response = await fetch(`${config.apiBaseUrl}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ verified: false })
          });
          break;
        
        case 'activate':
          response = await fetch(`${config.apiBaseUrl}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ verified: true })
          });
          break;
        
        case 'delete':
          response = await fetch(`${config.apiBaseUrl}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          break;
        
        case 'promote':
          response = await fetch(`${config.apiBaseUrl}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'admin' })
          });
          break;
        
        case 'demote':
          response = await fetch(`${config.apiBaseUrl}/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'user' })
          });
          break;
        
        default:
          return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Action failed');
      }

      console.log(`User ${action}d successfully`);
      fetchUsers();
      setShowConfirmModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      console.error('User action error:', error);
      
      // Fallback to direct Supabase query if API fails
      try {
        console.log(`Attempting fallback to direct Supabase ${action}...`);
        let result;
        
        switch (action) {
          case 'suspend':
            result = await supabase
              .from('users')
              .update({ verified: false })
              .eq('id', userId);
            break;
          
          case 'activate':
            result = await supabase
              .from('users')
              .update({ verified: true })
              .eq('id', userId);
            break;
          
          case 'delete':
            result = await supabase
              .from('users')
              .delete()
              .eq('id', userId);
            break;
          
          case 'promote':
            result = await supabase
              .from('users')
              .update({ role: 'admin' })
              .eq('id', userId);
            break;
          
          case 'demote':
            result = await supabase
              .from('users')
              .update({ role: 'user' })
              .eq('id', userId);
            break;
          
          default:
            return;
        }

        if (result.error) throw result.error;

        console.log(`Fallback: User ${action}d successfully`);
        fetchUsers();
        setShowConfirmModal(false);
        setSelectedUser(null);
      } catch (fallbackError) {
        console.error(`Fallback ${action} also failed:`, fallbackError);
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? '#F59E0B' : '#3B82F6';
  };

  const getOnlineStatusColor = (isOnline) => {
    return isOnline ? '#10B981' : '#6B7280';
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
          <p style={{ color: COLORS.text }}>Loading users...</p>
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
            Users Management
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search users..."
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
            <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              {filteredUsers.length} users
            </span>
          </div>
        </div>

        {/* Users Table */}
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
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Contact</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Role</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Stats</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Joined</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: COLORS.primary + '20',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: COLORS.primary,
                        }}>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p style={{ fontWeight: '500', color: COLORS.text, margin: 0 }}>
                            {user.name || 'Unknown'}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>
                            ID: {user.code_number || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: COLORS.text, margin: '0.25rem 0' }}>
                          <FaPhone style={{ marginRight: '0.5rem' }} />{user.phone_number || 'N/A'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: COLORS.text, margin: '0.25rem 0' }}>
                          <FaEnvelope style={{ marginRight: '0.5rem' }} />{user.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: getRoleColor(user.role) + '20',
                        color: getRoleColor(user.role),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          backgroundColor: user.verified ? '#10B98120' : '#EF444420',
                          color: user.verified ? '#10B981' : '#EF4444',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                        }}>
                          {user.verified ? 'verified' : 'unverified'}
                        </span>
                        <span style={{
                          backgroundColor: getOnlineStatusColor(user.is_online) + '20',
                          color: getOnlineStatusColor(user.is_online),
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                        }}>
                          {user.is_online ? 'online' : 'offline'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        <div><FaCar style={{ marginRight: '0.5rem' }} />{user.completed_trips || 0} completed trips</div>
                        <div><FaChartBar style={{ marginRight: '0.5rem' }} />{user.total_trips || 0} total trips</div>
                        <div><FaStar style={{ marginRight: '0.5rem' }} />{user.average_rating || 0} avg rating</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
                        {formatDate(user.created_at)}
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#2563EB';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = '#3B82F6';
                          }}
                        >
                          <FaEye style={{ marginRight: '0.25rem' }} />View
                        </button>
                        
                        {user.verified ? (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('suspend');
                              setShowConfirmModal(true);
                            }}
                            style={{
                              padding: '0.375rem 0.75rem',
                              backgroundColor: '#F59E0B',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = '#D97706';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = '#F59E0B';
                            }}
                          >
                            <FaBan style={{ marginRight: '0.25rem' }} />Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('activate');
                              setShowConfirmModal(true);
                            }}
                            style={{
                              padding: '0.375rem 0.75rem',
                              backgroundColor: '#10B981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = '#059669';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = '#10B981';
                            }}
                          >
                            <FaCheck style={{ marginRight: '0.25rem' }} />Verify
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('delete');
                            setShowConfirmModal(true);
                          }}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#DC2626';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = '#EF4444';
                          }}
                        >
                          <FaTrash style={{ marginRight: '0.25rem' }} />Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedUser && (
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
          zIndex: 1000,
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1rem' }}>
              Confirm {actionType}
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Are you sure you want to {actionType} user "{selectedUser.name}"?
              {actionType === 'delete' && ' This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedUser(null);
                  setActionType('');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserAction(selectedUser.id, actionType)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: actionType === 'delete' ? '#EF4444' : COLORS.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
