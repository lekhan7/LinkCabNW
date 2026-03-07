import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';

const SimpleProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  // Check if token exists in localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // Only redirect if no token exists
  if (!token || !user) {
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

export default SimpleProtectedRoute;
