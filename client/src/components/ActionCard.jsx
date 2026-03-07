import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../utils/constants';

/**
 * ActionCard component for quick actions (Linktree-style)
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {string} props.icon - Icon or emoji
 * @param {string} props.path - Navigation path
 * @param {string} props.color - Accent color
 * @param {function} props.onClick - Custom click handler
 * @param {number} props.delay - Animation delay in seconds
 */
const ActionCard = ({ 
  title, 
  description, 
  icon, 
  path, 
  color = COLORS.primary,
  onClick,
  delay = 0
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay,
        ease: 'easeOut'
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  const gradientStyle = {
    background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
    borderColor: color + '40',
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      style={{
        borderRadius: '20px',
        padding: '2rem',
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onMouseEnter={(e) => {
        e.target.style.borderColor = color + '60';
        e.target.style.boxShadow = `0 12px 40px ${color}30`;
        e.target.style.background = gradientStyle.background;
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = COLORS.border;
        e.target.style.boxShadow = 'none';
        e.target.style.background = COLORS.surface;
      }}
    >
      {/* Background gradient overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: gradientStyle.background,
          opacity: 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        className="gradient-overlay"
      />

      {/* Icon */}
      <div
        style={{
          fontSize: '2.5rem',
          marginBottom: '1rem',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3
          style={{
            color: COLORS.text,
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            lineHeight: '1.3',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: COLORS.textSecondary,
            fontSize: '0.9rem',
            margin: 0,
            lineHeight: '1.4',
          }}
        >
          {description}
        </p>
      </div>

      {/* Hover indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transform: 'translateX(10px)',
          transition: 'all 0.3s ease-in-out',
        }}
        className="hover-indicator"
      >
        <span style={{ color: COLORS.background, fontSize: '12px' }}>→</span>
      </div>

      <style jsx>{`
        .gradient-overlay {
          opacity: 0;
        }
        .hover-indicator {
          opacity: 0;
          transform: translateX(10px);
        }
        :hover .gradient-overlay {
          opacity: 1;
        }
        :hover .hover-indicator {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
    </motion.div>
  );
};

export default ActionCard;
