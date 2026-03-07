import React from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';

/**
 * Reusable Card component with glassmorphism effect
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.glassmorphism - Enable glassmorphism effect
 * @param {boolean} props.hoverable - Enable hover animations
 * @param {function} props.onClick - Click handler
 * @param {string} props.padding - Custom padding (default: '1.5rem')
 */
const Card = ({ 
  children, 
  className = '', 
  style = {}, 
  glassmorphism = true,
  hoverable = false,
  onClick,
  padding = '1.5rem'
}) => {
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    },
    hover: hoverable ? {
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    } : {},
    tap: hoverable ? {
      scale: 0.98,
      transition: {
        duration: 0.1,
        ease: 'easeInOut'
      }
    } : {}
  };

  const baseStyle = {
    borderRadius: '16px',
    padding,
    backgroundColor: glassmorphism 
      ? 'rgba(248, 248, 248, 0.8)' 
      : COLORS.surface,
    backdropFilter: glassmorphism ? 'blur(10px)' : 'none',
    border: glassmorphism 
      ? '1px solid rgba(245, 196, 0, 0.2)' 
      : `1px solid ${COLORS.border}`,
    boxShadow: glassmorphism 
      ? '0 8px 32px rgba(245, 196, 0, 0.15)' 
      : 'none',
    transition: 'all 0.3s ease-in-out',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  return (
    <motion.div
      className={className}
      style={baseStyle}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={hoverable ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default Card;
