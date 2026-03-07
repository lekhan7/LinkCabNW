import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { config } from '../config/env';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { phoneNumber, otp: correctOTP, userId } = location.state || {};

  useEffect(() => {
    if (!phoneNumber) {
      navigate('/login');
      return;
    }

    // Show OTP alert when page loads
    if (correctOTP) {
      alert(`Your OTP is: ${correctOTP}`);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phoneNumber, correctOTP, navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const otpArray = pastedData.split('');
      setOtp(otpArray);
      
      // Focus last input
      const lastInput = document.getElementById('otp-5');
      if (lastInput) {
        lastInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      alert('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: phoneNumber, 
          otp: otpString,
          userId: userId
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store token and user data in localStorage
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        // Update Redux state
        dispatch(loginSuccess({
          user: result.data.user,
          token: result.data.token
        }));
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        alert(result.message || 'Invalid OTP');
      }
    } catch (error) {
      alert('OTP verification failed. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Your new OTP is: ${result.data.otp}`);
        setTimeLeft(600); // Reset timer
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        
        // Focus first input
        const firstInput = document.getElementById('otp-0');
        if (firstInput) {
          firstInput.focus();
        }
      } else {
        alert(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      alert('Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          <h1
            style={{
              color: COLORS.primary,
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}
          >
            Verify OTP
          </h1>
          <p
            style={{
              color: COLORS.textSecondary,
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
            }}
          >
            We've sent a 6-digit code to
          </p>
          <p
            style={{
              color: COLORS.text,
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            {phoneNumber}
          </p>
        </div>

        {/* OTP Input */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
            }}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                maxLength={1}
                style={{
                  width: '50px',
                  height: '50px',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  backgroundColor: COLORS.background,
                  border: `2px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.text,
                  transition: 'all 0.3s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.primary;
                  e.target.style.outline = 'none';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.border;
                }}
              />
            ))}
          </div>

          {/* Timer */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}
          >
            {timeLeft > 0 ? (
              <p
                style={{
                  color: COLORS.textSecondary,
                  fontSize: '0.9rem',
                }}
              >
                Resend OTP in {formatTime(timeLeft)}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.primary,
                  fontSize: '0.9rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: isLoading || otp.join('').length !== 6 ? COLORS.textSecondary : COLORS.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading || otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default OTPVerification;
