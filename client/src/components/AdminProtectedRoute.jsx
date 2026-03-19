import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { COLORS } from '../utils/constants';

const AdminProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('Please login to access admin panel');
        setLoading(false);
        return;
      }

      // First check if user has admin credentials stored in session
      const isAdminFromSession = sessionStorage.getItem('isAdmin') === 'true';
      
      if (isAdminFromSession && session.user.email === 'admin@gmail.com') {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // For other users, check if user has admin role from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !userData || userData.role !== 'admin') {
        // Sign out if not admin
        await supabase.auth.signOut();
        console.error('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Authentication error');
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.background,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: `4px solid ${COLORS.primary}20`,
              borderTop: `4px solid ${COLORS.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: COLORS.text, fontSize: '0.9rem' }}>
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
