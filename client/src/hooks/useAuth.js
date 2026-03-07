import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { authAPI } from '../services/api';
import { loginStart, loginSuccess, loginFailure, logout, clearError } from '../store/authSlice';
import { initializeSocket } from '../utils/socket';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  // Initialize socket when token changes
  useEffect(() => {
    if (token) {
      initializeSocket(token);
    }
  }, [token]);

  
  const signup = async (userData) => {
    try {
      dispatch(loginStart());
      const response = await authAPI.signup(userData);
      dispatch(loginSuccess({ user: null, token: null })); // Will be set after OTP
      return { success: true, data: response };
    } catch (error) {
      dispatch(loginFailure(error.message || 'Signup failed'));
      return { success: false, error };
    }
  };

  const login = async (credentials) => {
    try {
      dispatch(loginStart());
      const response = await authAPI.login(credentials);
      
      // Always requires OTP, don't set user/token yet
      dispatch(loginSuccess({ user: null, token: null }));
      
      return { success: true, data: response };
    } catch (error) {
      dispatch(loginFailure(error.message || 'Login failed'));
      return { success: false, error };
    }
  };

  const verifyOTP = async (phoneNumber, otp) => {
    try {
      dispatch(loginStart());
      console.log('🔍 Sending OTP verification request:', { phoneNumber, otp });
      const response = await authAPI.verifyOTP({ phoneNumber, otp });
      console.log('🔍 OTP verification response:', response);
      
      // The axios interceptor unwraps the response, so token is directly in response.token
      if (response && response.token) {
        console.log('🔍 Token found in response:', response.token);
        dispatch(loginSuccess({ user: response.user, token: response.token }));
        navigate('/dashboard');
      } else {
        console.error('🔍 No token in OTP response:', response);
        dispatch(loginFailure('No token received from server'));
      }
      
      return { success: true, data: response };
    } catch (error) {
      console.error('🔍 OTP verification error:', error);
      dispatch(loginFailure(error.message || 'OTP verification failed'));
      return { success: false, error };
    }
  };

  const resendOTP = async (phoneNumber) => {
    try {
      const response = await authAPI.resendOTP({ phoneNumber });
      return { success: true, data: response };
    } catch (error) {
      dispatch(loginFailure(error.message || 'Failed to resend OTP'));
      return { success: false, error };
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    signup,
    login,
    verifyOTP,
    resendOTP,
    logout: handleLogout,
    clearError: clearAuthError,
  };
};
