import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

const PreferredPlaceChip = ({ place, onRemove, removable = false }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#334155',
        transition: 'all 0.2s ease',
        cursor: removable ? 'default' : 'pointer'
      }}
      onMouseEnter={(e) => {
        if (!removable) {
          e.target.style.backgroundColor = '#f1f5f9';
          e.target.style.borderColor = '#cbd5e1';
        }
      }}
      onMouseLeave={(e) => {
        if (!removable) {
          e.target.style.backgroundColor = '#f8fafc';
          e.target.style.borderColor = '#e2e8f0';
        }
      }}
    >
      <FaMapMarkerAlt style={{ fontSize: '0.75rem', color: '#64748b' }} />
      <span>{place}</span>
      {removable && onRemove && (
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.125rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            lineHeight: 1,
            marginLeft: '0.25rem'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e2e8f0';
            e.target.style.color = '#475569';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#94a3b8';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default PreferredPlaceChip;
