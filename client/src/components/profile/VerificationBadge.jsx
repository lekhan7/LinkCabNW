import React from 'react';
import { FaCheckCircle, FaPhone, FaEnvelope } from 'react-icons/fa';

const VerificationBadge = ({ type, verified, label }) => {
  const getIcon = () => {
    switch (type) {
      case 'phone':
        return <FaPhone />;
      case 'email':
        return <FaEnvelope />;
      default:
        return <FaCheckCircle />;
    }
  };

  const getBadgeColor = () => {
    if (!verified) return '#9ca3af';
    
    switch (type) {
      case 'phone':
        return '#10b981';
      case 'email':
        return '#3b82f6';
      default:
        return '#10b981';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        backgroundColor: verified ? `${getBadgeColor()}15` : '#f3f4f6',
        border: `1px solid ${verified ? getBadgeColor() : '#e5e7eb'}`,
        borderRadius: '20px',
        fontSize: '0.8125rem',
        fontWeight: '500',
        color: verified ? getBadgeColor() : '#6b7280',
        transition: 'all 0.2s ease'
      }}
    >
      <span style={{ fontSize: '0.875rem' }}>
        {getIcon()}
      </span>
      <span>{label}</span>
      {verified && (
        <FaCheckCircle style={{ fontSize: '0.75rem' }} />
      )}
    </div>
  );
};

export default VerificationBadge;
