import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast';
import { COLORS } from '../utils/constants';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { info } = useToast();
  const hasShownToast = useRef(false);
  
  // Use Redux auth state - it already handles token validation and persistence
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  // Show toast only once when not authenticated and not loading
  useEffect(() => {
    if (!isAuthenticated && !isLoading && !hasShownToast.current) {
      info('Please login first');
      hasShownToast.current = true;
    }
  }, [isAuthenticated, isLoading, info]);

  // Show loading spinner while auth is being initialized
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: COLORS.background,
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      </motion.div>
    );
  }

  // Only redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default ProtectedRoute;
