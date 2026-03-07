import React from 'react';
import { FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';

const RecentRightItem = ({ rightName, status, date }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'accepted':
        return <FaCheckCircle />;
      case 'rejected':
        return <FaTimesCircle />;
      case 'pending':
        return <FaHourglassHalf />;
      default:
        return <FaClock />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'accepted':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '0.75rem',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#f9fafb';
        e.target.style.borderColor = '#d1d5db';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#ffffff';
        e.target.style.borderColor = '#e5e7eb';
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '0.9375rem',
            fontWeight: '500',
            color: '#1f2937',
            marginBottom: '0.25rem'
          }}
        >
          {rightName}
        </div>
        <div
          style={{
            fontSize: '0.8125rem',
            color: '#6b7280'
          }}
        >
          {formatDate(date)}
        </div>
      </div>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.75rem',
          backgroundColor: `${getStatusColor()}15`,
          borderRadius: '12px',
          fontSize: '0.8125rem',
          fontWeight: '500',
          color: getStatusColor()
        }}
      >
        <span style={{ fontSize: '0.875rem' }}>
          {getStatusIcon()}
        </span>
        <span>{getStatusText()}</span>
      </div>
    </div>
  );
};

export default RecentRightItem;
