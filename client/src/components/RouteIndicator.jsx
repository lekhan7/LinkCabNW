import React from 'react';

const RouteIndicator = ({ from, to, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#9ca3af'; // grey
      case 'Requested':
        return '#3b82f6'; // blue
      case 'Accepted':
        return '#10b981'; // green
      default:
        return '#9ca3af';
    }
  };

  const color = getStatusColor(status);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          fontSize: '0.95rem',
          fontWeight: '500',
          color: '#374151',
          minWidth: '80px',
        }}
      >
        {from}
      </div>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
        
        <div
          style={{
            flex: 1,
            height: '2px',
            backgroundColor: color,
            opacity: 0.6,
          }}
        />
        
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
      </div>
      
      <div
        style={{
          fontSize: '0.95rem',
          fontWeight: '500',
          color: '#374151',
          minWidth: '80px',
          textAlign: 'right',
        }}
      >
        {to}
      </div>
    </div>
  );
};

export default RouteIndicator;
