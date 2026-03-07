import { createSlice } from '@reduxjs/toolkit';
import { authAPI } from '../services/api';
import { reconnectSocket } from '../utils/socket';

// Helper function to validate token
const validateToken = (token) => {
  if (!token) return false;
  
  try {
    // Decode JWT to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired (with 5-day buffer as requested)
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

const token = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
let parsedUser = null;

if (storedUser) {
  try {
    parsedUser = JSON.parse(storedUser);
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    localStorage.removeItem('user');
  }
}

const initialState = {
  user: parsedUser,
  token: token,
  isAuthenticated: validateToken(token),
  isLoading: true, // Start with loading true to ensure auth initialization
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      // Only set isAuthenticated to true if there's a valid token
      state.isAuthenticated = validateToken(action.payload.token);
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
      state.error = null;
      // Reconnect socket with new token
      reconnectSocket(action.payload.token);
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    initializeAuth: (state) => {
      state.isLoading = true;
    },
    initializeAuthSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    initializeAuthFailure: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateUser,
  initializeAuth,
  initializeAuthSuccess,
  initializeAuthFailure,
} = authSlice.actions;

// Async thunk for initializing authentication
export const checkAuthStatus = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (!token) {
    dispatch(initializeAuthFailure());
    return;
  }

  dispatch(initializeAuth());
  
  try {
    const response = await authAPI.getProfile();
    if (response && response.data) {
      dispatch(initializeAuthSuccess({ user: response.data }));
    } else {
      // Fallback to stored user data if API fails
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          dispatch(initializeAuthSuccess({ user: userData }));
        } catch (error) {
          dispatch(initializeAuthFailure());
        }
      } else {
        dispatch(initializeAuthFailure());
      }
    }
  } catch (error) {
    console.error('Auth initialization failed:', error);
    // Fallback to stored user data if API fails
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        dispatch(initializeAuthSuccess({ user: userData }));
      } catch (parseError) {
        dispatch(initializeAuthFailure());
      }
    } else {
      dispatch(initializeAuthFailure());
    }
  }
};

export default authSlice.reducer;
