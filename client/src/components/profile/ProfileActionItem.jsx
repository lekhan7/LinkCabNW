import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileContract, FaShieldAlt, FaExclamationTriangle, FaChevronRight } from 'react-icons/fa';

const ProfileActionItem = ({ icon, label, path, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    
    // Default icons based on label
    if (label.toLowerCase().includes('terms')) {
      return <FaFileContract />;
    }
    if (label.toLowerCase().includes('privacy')) {
      return <FaShieldAlt />;
    }
    if (label.toLowerCase().includes('disclaimer')) {
      return <FaExclamationTriangle />;
    }
    return <FaFileContract />;
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '1rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        fontSize: '0.9375rem',
        fontWeight: '500',
        color: '#374151'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#f9fafb';
        e.target.style.borderColor = '#d1d5db';
        e.target.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#ffffff';
        e.target.style.borderColor = '#e5e7eb';
        e.target.style.transform = 'translateX(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1rem', color: '#6b7280' }}>
          {getIcon()}
        </span>
        <span>{label}</span>
      </div>
      
      <FaChevronRight style={{ fontSize: '0.75rem', color: '#9ca3af' }} />
    </button>
  );
};

export default ProfileActionItem;
