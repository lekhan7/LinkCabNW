import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { FaTaxi } from 'react-icons/fa';
import { config } from '../config/env';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber || !password) {
      alert('Please enter both phone number and password');
      return;
    }
    
    // Check for admin credentials (using phone number as identifier)
    if (phoneNumber === 'admin@gmail.com' && password === '123') {
      // Redirect to admin login for proper admin authentication
      navigate('/admin/login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, password }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show OTP in alert
        alert(`Your OTP is: ${result.data.otp}`);
        
        // Navigate to OTP page
        navigate('/otp', { 
          state: { 
            phoneNumber: phoneNumber,
            otp: result.data.otp,
            userId: result.data.userId
          } 
        });
      } else {
        alert(result.message || 'Login failed');
      }
    } catch (error) {
      alert('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <FaTaxi 
              size={40} 
              style={{ 
                color: COLORS.primary,
                marginBottom: '1rem' 
              }} 
            />
            
            <h1 style={{ 
              color: COLORS.text, 
              fontSize: '2rem', 
              fontWeight: '700',
              marginBottom: '0.5rem' 
            }}>
              LinkCab
            </h1>
            
            <p style={{ 
              color: COLORS.textSecondary, 
              marginBottom: '2rem' 
            }}>
              Your trusted ride partner
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  color: COLORS.text,
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                }}
              >
                Phone Number or Admin Email
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91XXXXXXXXXX or admin@gmail.com"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: COLORS.background,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  color: COLORS.text,
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.primary;
                  e.target.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.18)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  color: COLORS.text,
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: COLORS.background,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  color: COLORS.text,
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.primary;
                  e.target.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.18)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: isLoading ? COLORS.textSecondary : COLORS.primary,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </motion.button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <p style={{ color: COLORS.textSecondary }}>
                Don't have an account?{' '}
                <a 
                  href="/signup" 
                  style={{ 
                    color: COLORS.primary, 
                    textDecoration: 'none', 
                    fontWeight: '600' 
                  }} 
                >
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
