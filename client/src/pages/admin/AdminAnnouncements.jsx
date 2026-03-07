import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';
import { FaMapMarkerAlt, FaRoute, FaCalendarAlt, FaClock, FaUsers, FaDollarSign, FaEye, FaBan, FaCheck, FaTrash, FaUserCircle, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import { config } from '../../config/env';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    start_location_name: '',
    destination_name: '',
    date: '',
    time: '',
    price: '',
    passenger_capacity: '',
    vehicle_type: 'personal_car',
    comfort_level: 'comfortable',
    seat_preference: 'partial-sharing',
    notes: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      console.log('Fetching announcements from admin API...');
      
      // Get fresh auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session');
      }
      
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/announcements', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Token expired, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Failed to refresh token: ' + refreshError.message);
        }
        
        if (!refreshedSession?.access_token) {
          console.error('No access token in refreshed session');
          throw new Error('No access token after refresh');
        }
        
        console.log('Token refreshed successfully');
        
        // Retry with new token
        const retryResponse = await fetch('/api/admin/announcements', {
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
        console.log('Fetched announcements count:', result.data?.length || 0);
        setAnnouncements(result.data || []);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('Fetched announcements count:', result.data?.length || 0);
      console.log('Sample announcement data:', result.data?.[0]);
      
      setAnnouncements(result.data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      console.error('Announcements fetch error:', error);
      
      // Fallback to direct Supabase query if API fails
      try {
        console.log('Attempting fallback to direct Supabase query...');
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            *,
            creator:users!announcements_created_by_fkey(name, phone_number)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Get participant counts for each announcement
        const announcementsWithCounts = await Promise.all(
          (data || []).map(async (announcement) => {
            const { count: participantCount } = await supabase
              .from('announcement_participants')
              .select('*', { count: 'exact', head: true })
              .eq('announcement_id', announcement.id)
              .eq('status', 'accepted');
            
            return {
              ...announcement,
              participants: participantCount || 0
            };
          })
        );
        
        console.log('Fallback fetched announcements count:', announcementsWithCounts.length);
        setAnnouncements(announcementsWithCounts);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        setAnnouncements([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementAction = async (announcementId, action) => {
    try {
      // Get fresh auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session');
      }
      
      let token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      let response;
      
      switch (action) {
        case 'delete':
          response = await fetch(`/api/admin/announcements/${announcementId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          break;
        
        case 'close':
          response = await fetch(`/api/admin/announcements/${announcementId}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ride_completed: true })
          });
          break;
        
        case 'reopen':
          response = await fetch(`/api/admin/announcements/${announcementId}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ride_completed: false })
          });
          break;
        
        default:
          return;
      }

      // Handle token expiration
      if (response.status === 401) {
        console.log('Token expired, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Failed to refresh token: ' + refreshError.message);
        }
        
        if (!refreshedSession?.access_token) {
          console.error('No access token in refreshed session');
          throw new Error('No access token after refresh');
        }
        
        console.log('Token refreshed successfully');
        token = refreshedSession.access_token;
        
        // Retry the request with new token
        switch (action) {
          case 'delete':
            response = await fetch(`/api/admin/announcements/${announcementId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            break;
          case 'close':
            response = await fetch(`/api/admin/announcements/${announcementId}/status`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ride_completed: true })
            });
            break;
          case 'reopen':
            response = await fetch(`/api/admin/announcements/${announcementId}/status`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ride_completed: false })
            });
            break;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 403) {
          console.error('Admin access denied:', errorData);
          throw new Error('Admin access denied. Your account may not have admin privileges. Please contact the system administrator.');
        } else if (response.status === 401) {
          console.error('Authentication failed:', errorData);
          throw new Error('Authentication failed. Please log out and log back in.');
        } else {
          console.error('API error:', errorData);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Action result:', result);

      // Show success message
      if (action === 'delete') {
        alert(`Announcement deleted successfully! ${result.notificationsSent > 0 ? `${result.notificationsSent} users were notified.` : ''}`);
        // Remove the deleted announcement from the list
        setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
      } else if (action === 'close') {
        alert('Announcement marked as completed successfully!');
        // Update the announcement in the list
        setAnnouncements(prev => prev.map(ann => 
          ann.id === announcementId 
            ? { ...ann, ride_completed: true, completed_at: new Date().toISOString() }
            : ann
        ));
      } else if (action === 'reopen') {
        alert('Announcement reopened successfully!');
        // Update the announcement in the list
        setAnnouncements(prev => prev.map(ann => 
          ann.id === announcementId 
            ? { ...ann, ride_completed: false, completed_at: null }
            : ann
        ));
      }

      // Close modals
      setShowConfirmModal(false);
      setSelectedAnnouncement(null);
      setActionType('');

    } catch (error) {
      console.error(`Failed to ${action} announcement:`, error);
      alert(`Failed to ${action} announcement: ${error.message}`);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      // Get fresh auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session');
      }
      
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createFormData)
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Token expired, refreshing...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Failed to refresh token: ' + refreshError.message);
        }
        
        if (!refreshedSession?.access_token) {
          console.error('No access token in refreshed session');
          throw new Error('No access token after refresh');
        }
        
        console.log('Token refreshed successfully');
        
        // Retry with new token
        const retryResponse = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${refreshedSession.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createFormData)
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
        }

        const result = await retryResponse.json();
        console.log('Created announcement:', result);
        
        // Add the new announcement to the list
        setAnnouncements(prev => [result.data, ...prev]);
        
        // Reset form and close modal
        setCreateFormData({
          start_location_name: '',
          destination_name: '',
          date: '',
          time: '',
          price: '',
          passenger_capacity: '',
          vehicle_type: 'personal_car',
          comfort_level: 'comfortable',
          seat_preference: 'partial-sharing',
          notes: ''
        });
        setShowCreateModal(false);
        
        alert('Announcement created successfully!');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Created announcement:', result);
      
      // Add the new announcement to the list
      setAnnouncements(prev => [result.data, ...prev]);
      
      // Reset form and close modal
      setCreateFormData({
        start_location_name: '',
        destination_name: '',
        date: '',
        time: '',
        price: '',
        passenger_capacity: '',
        vehicle_type: 'personal_car',
        comfort_level: 'comfortable',
        seat_preference: 'partial-sharing',
        notes: ''
      });
      setShowCreateModal(false);
      
      alert('Announcement created successfully!');

    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert(`Failed to create announcement: ${error.message}`);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.start_location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.destination_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.creator?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatusColor = (completed) => {
    if (completed) return '#EF4444';
    return '#10B981';
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
          <p style={{ color: COLORS.text }}>Loading announcements...</p>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '0.5rem' }}>
          Announcement Management
        </h1>
        <p style={{ color: '#6B7280', margin: 0 }}>
          Manage all ride announcements and user participation
        </p>
      </div>

      {/* Search Bar and Create Button */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by location, creator name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        />
        
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: COLORS.primary,
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = COLORS.primary + 'DD';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = COLORS.primary;
          }}
        >
          <FaPlus />
          Create Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Route</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Creator</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Date & Time</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Participants</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Price</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Created</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnouncements.map((announcement, index) => (
                  <motion.tr
                    key={announcement.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', color: COLORS.text, margin: '0.25rem 0' }}>
                          <FaMapMarkerAlt style={{ marginRight: '0.5rem', color: COLORS.primary }} />{announcement.start_location_name}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0' }}>
                          <FaRoute style={{ marginRight: '0.5rem' }} />{announcement.destination_name}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', color: COLORS.text, margin: '0.25rem 0' }}>
                          {announcement.creator?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0' }}>
                          <FaUserCircle style={{ marginRight: '0.5rem' }} />{announcement.creator?.phone_number || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: COLORS.text }}>
                        <div><FaCalendarAlt style={{ marginRight: '0.5rem' }} />{announcement.date}</div>
                        <div><FaClock style={{ marginRight: '0.5rem' }} />{announcement.time}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: getStatusColor(announcement.ride_completed) + '20',
                        color: getStatusColor(announcement.ride_completed),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}>
                        {announcement.ride_completed ? 'completed' : 'active'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        <div><FaUsers style={{ marginRight: '0.5rem' }} />{announcement.participants || 0} passengers</div>
                        <div><FaUsers style={{ marginRight: '0.5rem' }} />{announcement.passenger_capacity || 0} capacity</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: COLORS.text }}>
                        <FaDollarSign style={{ marginRight: '0.25rem' }} />{announcement.price || '0'}
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {formatDate(announcement.created_at)}
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            setSelectedAnnouncement(announcement);
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
                        
                        {announcement.ride_completed ? (
                          <button
                            onClick={() => {
                              setSelectedAnnouncement(announcement);
                              setActionType('reopen');
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
                            <FaCheck style={{ marginRight: '0.25rem' }} />Reopen
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAnnouncement(announcement);
                              setActionType('close');
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
                            <FaBan style={{ marginRight: '0.25rem' }} />Close
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedAnnouncement(announcement);
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

      {/* Details Modal */}
      {showDetailsModal && selectedAnnouncement && (
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
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1.5rem' }}>
              Announcement Details
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.25rem' }}>Route</h4>
                <p style={{ color: COLORS.text, margin: 0 }}>
                  {selectedAnnouncement.start_location_name} → {selectedAnnouncement.destination_name}
                </p>
              </div>
              
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.25rem' }}>Creator</h4>
                <p style={{ color: COLORS.text, margin: 0 }}>
                  {selectedAnnouncement.creator?.name || 'Unknown'}
                </p>
              </div>
              
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.25rem' }}>Date & Time</h4>
                <p style={{ color: COLORS.text, margin: 0 }}>
                  {selectedAnnouncement.date} at {selectedAnnouncement.time}
                </p>
              </div>
              
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.25rem' }}>Description</h4>
                <p style={{ color: COLORS.text, margin: 0 }}>
                  {selectedAnnouncement.description || 'No description provided'}
                </p>
              </div>
              
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.25rem' }}>Stats</h4>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <span>👥 {selectedAnnouncement.participants || 0} passengers</span>
                  <span>� {selectedAnnouncement.passenger_capacity || 0} capacity</span>
                  <span>💰 ${selectedAnnouncement.price || '0'}</span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAnnouncement(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: COLORS.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedAnnouncement && (
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
            <div style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Are you sure you want to {actionType} this announcement from "{selectedAnnouncement.start_location_name}" to "{selectedAnnouncement.destination_name}"?
              {actionType === 'delete' && (
                <div style={{ marginTop: '0.5rem', color: '#EF4444', fontWeight: '500' }}>
                  <FaExclamationTriangle style={{ marginRight: '0.5rem' }} />
                  This will permanently delete the announcement AND all related data including:
                  <ul style={{ marginLeft: '1rem', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                    <li>All participant bookings</li>
                    <li>Completion status records</li>
                    <li>Favorite announcements</li>
                    <li>All related notifications</li>
                  </ul>
                  This action cannot be undone.
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedAnnouncement(null);
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
                onClick={() => handleAnnouncementAction(selectedAnnouncement.id, actionType)}
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

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ margin: '0 0 1.5rem 0', color: COLORS.text }}>
              Create New Announcement
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Start Location *</label>
                <input
                  type="text"
                  value={createFormData.start_location_name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, start_location_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter start location"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Destination *</label>
                <input
                  type="text"
                  value={createFormData.destination_name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, destination_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter destination"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date *</label>
                  <input
                    type="date"
                    value={createFormData.date}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, date: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Time *</label>
                  <input
                    type="time"
                    value={createFormData.time}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, time: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Price (₹) *</label>
                  <input
                    type="number"
                    value={createFormData.price}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, price: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Enter price"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Passenger Capacity *</label>
                  <input
                    type="number"
                    value={createFormData.passenger_capacity}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, passenger_capacity: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Enter capacity"
                    min="1"
                    max="7"
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notes</label>
                <textarea
                  value={createFormData.notes}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Additional notes (optional)"
                />
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({
                    start_location_name: '',
                    destination_name: '',
                    date: '',
                    time: '',
                    price: '',
                    passenger_capacity: '',
                    vehicle_type: 'personal_car',
                    comfort_level: 'comfortable',
                    seat_preference: 'partial-sharing',
                    notes: ''
                  });
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleCreateAnnouncement}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: COLORS.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Create Announcement
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminAnnouncements;
