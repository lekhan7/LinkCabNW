import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../utils/constants';
import Avatar from './Avatar';

/**
 * ProfileCard component with user info and hover animations
 * @param {Object} props - Component props
 * @param {Object} props.user - User object with name, email, avatar, etc.
 * @param {string} props.user.name - User's name
 * @param {string} props.user.email - User's email
 * @param {string} props.user.avatar - User's avatar URL
 * @param {string} props.user.bio - User's bio/tagline
 * @param {function} props.onEditProfile - Edit profile handler
 * @param {boolean} props.showEditButton - Show edit profile button
 */
const ProfileCard = ({ 
  user, 
  onEditProfile,
  showEditButton = true 
}) => {
  const navigate = useNavigate();

  const handleEditProfile = () => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      navigate('/profile');
    }
  };

  const cardVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 0.2
      }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  // Default avatar if none provided
  const avatarUrl = user?.profilePicture || user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=F5C400&color=000&size=128`;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      style={{
        borderRadius: '24px',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(245, 196, 0, 0.1) 0%, rgba(26, 26, 26, 0.8) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(245, 196, 0, 0.2)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
      }}
      onClick={handleEditProfile}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(245, 196, 0, 0.1) 0%, transparent 70%)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />

      {/* Profile content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Avatar */}
        <motion.div
          style={{
            margin: '0 auto 1.5rem',
            position: 'relative',
            display: 'inline-block',
          }}
          whileHover={{ 
            scale: 1.1,
            rotate: 5,
            transition: { duration: 0.3 }
          }}
        >
          <Avatar
            imageUrl={avatarUrl}
            username={user?.name}
            size="large"
          />
          
          {/* Online indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: COLORS.success,
              border: '3px solid ' + COLORS.surface,
              boxShadow: '0 2px 8px rgba(68, 255, 68, 0.5)',
            }}
          />
        </motion.div>

        {/* User info */}
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              color: COLORS.text,
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              lineHeight: '1.2',
            }}
          >
            {user?.name || 'Guest User'}
          </h2>
          
          {user?.email && (
            <p
              style={{
                color: COLORS.textSecondary,
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}
            >
              {user.email}
            </p>
          )}

          {user?.bio && (
            <p
              style={{
                color: COLORS.textMuted,
                fontSize: '0.85rem',
                fontStyle: 'italic',
                marginBottom: '1.5rem',
                lineHeight: '1.4',
              }}
            >
              "{user.bio}"
            </p>
          )}

          {/* Edit button */}
          {showEditButton && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleEditProfile();
              }}
              style={{
                background: 'linear-gradient(135deg, ' + COLORS.primary + ' 0%, ' + COLORS.primaryDark + ' 100%)',
                color: COLORS.background,
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                boxShadow: '0 4px 16px rgba(245, 196, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 24px rgba(245, 196, 0, 0.4)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 16px rgba(245, 196, 0, 0.3)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Edit Profile
            </motion.button>
          )}
        </div>
      </div>

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          50% {
            transform: translate(-20px, -20px) rotate(180deg);
          }
        }
      `}</style>
    </motion.div>
  );
};

export default ProfileCard;
