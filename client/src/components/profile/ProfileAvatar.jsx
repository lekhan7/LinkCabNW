import React from 'react';

const ProfileAvatar = ({ imageUrl, username, size = 'large', onClick, editable = false }) => {
  const avatarSize = {
    small: '80px',
    medium: '120px',
    large: '160px',
    xlarge: '200px'
  };

  const currentSize = avatarSize[size] || avatarSize.large;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}
    >
      <div
        onClick={onClick}
        style={{
          position: 'relative',
          cursor: editable ? 'pointer' : 'default',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (editable) {
            e.target.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          if (editable) {
            e.target.style.transform = 'scale(1)';
          }
        }}
      >
        <div
          style={{
            width: currentSize,
            height: currentSize,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid #ffffff',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#f8fafc'
          }}
        >
          {imageUrl && imageUrl !== '' ? (
            <img
              src={imageUrl}
              alt={username || 'User avatar'}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: imageUrl && imageUrl !== '' ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontWeight: '600',
              fontSize: size === 'large' ? '2rem' : size === 'medium' ? '1.5rem' : '1rem'
            }}
          >
            {getInitials(username)}
          </div>
        </div>
        
        {editable && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              border: '3px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
          >
            📷
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileAvatar;
