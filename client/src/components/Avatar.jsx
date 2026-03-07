import React from 'react';

const Avatar = ({ 
  imageUrl, 
  username, 
  size = 'medium',
  showName = false,
  style = {},
  className = ''
}) => {
  const sizeStyles = {
    small: {
      width: '32px',
      height: '32px',
      fontSize: '12px'
    },
    medium: {
      width: '48px',
      height: '48px',
      fontSize: '16px'
    },
    large: {
      width: '64px',
      height: '64px',
      fontSize: '20px'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const avatarStyle = {
    ...currentSize,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #f3f4f6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontWeight: '600',
    ...style
  };

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const nameStyle = {
    fontSize: currentSize.fontSize,
    fontWeight: '500',
    color: '#374151'
  };

  if (imageUrl && imageUrl !== '') {
    return (
      <div style={showName ? containerStyle : {}} className={className}>
        <img
          src={imageUrl}
          alt={username || 'User avatar'}
          style={avatarStyle}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div style={{ ...avatarStyle, display: 'none' }}>
          {getInitials(username)}
        </div>
        {showName && username && (
          <span style={nameStyle}>{username}</span>
        )}
      </div>
    );
  }

  return (
    <div style={showName ? containerStyle : {}} className={className}>
      <div style={avatarStyle}>
        {getInitials(username)}
      </div>
      {showName && username && (
        <span style={nameStyle}>{username}</span>
      )}
    </div>
  );
};

export default Avatar;
