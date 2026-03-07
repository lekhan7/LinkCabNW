import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';
import { FaFlag, FaEye, FaCheck, FaBan, FaTrash, FaUser, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { config } from '../../config/env';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      console.log('Fetching reports from admin API...');
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${config.apiBaseUrl}/admin/reports`, {
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
      
      console.log('Fetched reports count:', result.data?.length || 0);
      console.log('Sample report data:', result.data?.[0]);
      
      setReports(result.data || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      console.error('Reports fetch error:', error);
      
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
          .not('report_type', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Fallback fetched reports count:', data?.length || 0);
        setReports(data || []);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        setReports([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      let response;
      let status;
      let adminNotes = '';
      
      switch (action) {
        case 'warn':
          status = 'resolved';
          adminNotes = 'User warned';
          break;
        
        case 'suspend':
          status = 'resolved';
          adminNotes = 'User suspended';
          break;
        
        case 'delete_user':
          status = 'resolved';
          adminNotes = 'User deleted';
          break;
        
        case 'resolve':
          status = 'dismissed';
          adminNotes = 'Dismissed';
          break;
        
        default:
          return;
      }

      response = await fetch(`${config.apiBaseUrl}/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, admin_notes: adminNotes })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Action failed');
      }

      console.log(`Report ${action}d successfully`);
      fetchReports();
      setShowActionModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error(`Failed to ${action} report:`, error);
      console.error('Report action error:', error);
      
      // Fallback to direct Supabase query if API fails
      try {
        console.log(`Attempting fallback to direct Supabase ${action}...`);
        let result;
        
        switch (action) {
          case 'warn':
            result = await supabase
              .from('ride_reports')
              .update({ status: 'resolved', admin_notes: 'User warned' })
              .eq('id', reportId);
            break;
          
          case 'suspend':
            result = await supabase
              .from('ride_reports')
              .update({ status: 'resolved', admin_notes: 'User suspended' })
              .eq('id', reportId);
            break;
          
          case 'delete_user':
            result = await supabase
              .from('ride_reports')
              .update({ status: 'resolved', admin_notes: 'User deleted' })
              .eq('id', reportId);
            break;
          
          case 'resolve':
            result = await supabase
              .from('ride_reports')
              .update({ status: 'dismissed', admin_notes: 'Dismissed' })
              .eq('id', reportId);
            break;
          
          default:
            return;
        }

        if (result.error) throw result.error;

        console.log(`Fallback: Report ${action}d successfully`);
        fetchReports();
        setShowActionModal(false);
        setSelectedReport(null);
      } catch (fallbackError) {
        console.error(`Fallback ${action} also failed:`, fallbackError);
      }
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reviewer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reviewee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
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
      case 'resolved': return '#10B981';
      case 'investigating': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'inappropriate_behavior': return '#EF4444';
      case 'spam': return '#F59E0B';
      case 'fake_profile': return '#8B5CF6';
      case 'no_show': return '#06B6D4';
      case 'other': return '#6B7280';
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
          <p style={{ color: COLORS.text }}>Loading reports...</p>
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
            Reports Management
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search reports..."
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
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
            <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              {filteredReports.length} reports
            </span>
          </div>
        </div>

        {/* Reports Table */}
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
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Reporter</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Reported User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Reason</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Description</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Route</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, index) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    style={{ borderBottom: '1px solid #E5E7EB' }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', color: COLORS.text, margin: '0.25rem 0' }}>
                          {report.reviewer?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0' }}>
                          {report.reviewer?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', color: COLORS.text, margin: '0.25rem 0' }}>
                          {report.reviewee?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.25rem 0' }}>
                          {report.reviewee?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: getReasonColor(report.report_type) + '20',
                        color: getReasonColor(report.report_type),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                      }}>
                        {report.report_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: COLORS.text, 
                        maxWidth: '250px',
                        lineHeight: '1.4'
                      }}>
                        {report.report_description?.substring(0, 100)}...
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: COLORS.text }}>
                        {report.announcement ? (
                          <>
                            <div>{report.announcement.from_location}</div>
                            <div>→ {report.announcement.to_location}</div>
                          </>
                        ) : (
                          <span style={{ color: '#6B7280' }}>N/A</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: getStatusColor(report.status) + '20',
                        color: getStatusColor(report.status),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                      }}>
                        {report.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {formatDate(report.created_at)}
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {report.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('warn');
                              setShowActionModal(true);
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
                            Warn
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('suspend');
                              setShowActionModal(true);
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
                            Suspend
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType('resolve');
                              setShowActionModal(true);
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
                            Resolve
                          </button>
                        </div>
                      )}
                      {report.status === 'resolved' && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#10B981',
                          fontWeight: '500'
                        }}>
                          {report.resolution}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Action Modal */}
      {showActionModal && selectedReport && (
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
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1rem' }}>
              Confirm Action
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#6B7280', marginBottom: '1rem' }}>
                <strong>Report Details:</strong>
              </p>
              <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                <div><strong>Reporter:</strong> {selectedReport.reviewer?.name}</div>
                <div><strong>Reported User:</strong> {selectedReport.reviewee?.name}</div>
                <div><strong>Reason:</strong> {selectedReport.report_type?.replace('_', ' ')}</div>
                <div><strong>Description:</strong> {selectedReport.report_description}</div>
              </div>
            </div>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Are you sure you want to {actionType.replace('_', ' ')} this report?
              {actionType === 'suspend' && ' This will suspend the reported user.'}
              {actionType === 'delete_user' && ' This will permanently delete the reported user.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedReport(null);
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
                onClick={() => handleReportAction(selectedReport.id, actionType)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: actionType.includes('delete') || actionType === 'suspend' ? '#EF4444' : COLORS.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                {actionType.replace('_', ' ').charAt(0).toUpperCase() + actionType.replace('_', ' ').slice(1)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
