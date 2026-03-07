import React from 'react';
import { motion } from 'framer-motion';

const StatusTabs = ({ activeTab, onTabChange }) => {
  const tabs = ['Pending', 'Accepted', 'Rejected'];
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#6b7280'; // grey
      case 'Accepted':
        return '#10b981'; // green
      case 'Rejected':
        return '#ef4444'; // red
      default:
        return '#6b7280';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        backgroundColor: '#E8E8E8',
        padding: '0.25rem',
        borderRadius: '12px',
        marginBottom: '2rem',
      }}
    >
      {tabs.map((tab) => (
        <motion.button
          key={tab}
          onClick={() => onTabChange(tab)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            flex: 1,
            padding: '0.875rem 1.5rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: activeTab === tab ? '#F5F5F5' : 'transparent',
            color: activeTab === tab ? getStatusColor(tab) : '#64748b',
            boxShadow: activeTab === tab 
              ? '0 2px 8px rgba(0, 0, 0, 0.08)' 
              : 'none',
          }}
        >
          {tab}
        </motion.button>
      ))}
    </div>
  );
};

export default StatusTabs;
