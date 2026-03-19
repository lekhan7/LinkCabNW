require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { testConnection } = require('./config/supabase');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const { securityHeaders } = require('./middleware/security');

// Log JWT_SECRET existence (never log the actual secret)
console.log('✅ JWT_SECRET loaded:', !!process.env.JWT_SECRET);

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const usersRoutes = require('./routes/users'); // Alias for /api/users path
const rideRoutes = require('./routes/rides');
const announcementRoutes = require('./routes/announcements');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const connectionRoutes = require('./routes/connection');
const ratingRoutes = require('./routes/ratings');
const reviewRoutes = require('./routes/reviews');
const rideCompletionRoutes = require('./routes/rideCompletion');
const reportRoutes = require('./routes/reports');
const analyticsRoutes = require('./routes/analytics');
const userAnalyticsRoutes = require('./routes/userAnalytics');
const userAnalyticsNewRoutes = require('./routes/userAnalyticsNew');
const recentActivityRoutes = require('./routes/recentActivity');
const favoritesRoutes = require('./routes/favorites');
const publicRoutes = require('./routes/public');
const adminUsersRoutes = require('./routes/adminUsers');
const adminAnnouncementsRoutes = require('./routes/adminAnnouncements');
const adminReviewsRoutes = require('./routes/adminReviews');
const adminReportsRoutes = require('./routes/adminReports');
const adminFeedbackRoutes = require('./routes/adminFeedback');
const feedbackRoutes = require('./routes/feedback');
const debugAuthRoutes = require('./routes/debugAuth');

const app = express();
const server = http.createServer(app);

// Trust proxy for rate limiting (fixes X-Forwarded-For error)
app.set('trust proxy', true);

// Socket.io setup for real-time notifications
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://linkcab-fj1k.onrender.com',
      'https://linkcab.pages.dev',
      'https://linkcab.ktkarumbaiah.workers.dev'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const { supabase } = require('./config/supabase');
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user) {
      return next(new Error('User not found'));
    }
    
    // Attach user to socket
    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket authentication error:', err.message);
    next(new Error('Authentication failed'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔗 Authenticated user connected: ${socket.user.id} (${socket.id})`);
  
  // Join user to their personal room for targeted notifications
  socket.on('join-user-room', (userId) => {
    if (socket.user.id === userId) {
      socket.join(`user-${userId}`);
      connectedUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} joined their room`);
    }
  });

  // Handle announcement joins for real-time updates
  socket.on('join-announcement-room', (announcementId) => {
    socket.join(`announcement-${announcementId}`);
    console.log(`🚗 User ${socket.user.id} joined announcement room: ${announcementId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Find and remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`👋 User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Export io for use in other modules
module.exports.io = io;

// Security middleware
app.use(securityHeaders);
app.use(hpp());

// Rate limiting for authentication routes only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  trustProxy: true // Important for deployment behind proxy
});

// CORS configuration - Updated for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', // Added for admin development
  'http://localhost:3000',
  'https://linkcab-fj1k.onrender.com',
  'https://linkcab.pages.dev'
];

// More permissive CORS configuration for debugging
app.use(cors({
  origin: true, // Allow all origins temporarily for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Token-ID', 'x-token-id'],
  exposedHeaders: ['X-Token-ID'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicit OPTIONS handling for preflight requests
app.options(/.*/, cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Database connection with Supabase
const connectDB = async () => {
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('✅ Connected to Supabase');
    } else {
      console.error('❌ Failed to connect to Supabase');
      // Retry connection after 5 seconds
      setTimeout(connectDB, 5000);
    }
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Debug route to check server status
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    env: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ride', rideRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/connection', connectionRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ride-completion', rideCompletionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user-analytics', userAnalyticsRoutes);
app.use('/api/user-analytics-new', userAnalyticsNewRoutes);
app.use('/api/recent-activity', recentActivityRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/announcements', adminAnnouncementsRoutes);
app.use('/api/admin/reviews', adminReviewsRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/feedback', adminFeedbackRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/debug', debugAuthRoutes);

// Debug route to list all routes
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: middleware.regexp.source.replace(/\\\//g, '/').replace(/\?\(\.\*\)/g, '').slice(1, -1),
          });
        }
      });
    }
  });
  
  const adminRoutes = routes.filter(route => route.path.includes('admin'));
  res.json({
    success: true,
    totalRoutes: routes.length,
    adminRoutes,
    allRoutes: routes.slice(0, 20) // Show first 20 routes
  });
});

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const connected = await testConnection();
    
    res.status(connected ? 200 : 503).json({ 
      status: connected ? 'OK' : 'ERROR', 
      message: connected ? 'LinkCab API is running' : 'Database connection failed',
      timestamp: new Date().toISOString(),
      database: {
        type: 'Supabase',
        status: connected ? 'connected' : 'disconnected'
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      database: {
        type: 'Supabase',
        status: 'error',
        error: error.message
      },
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Enhanced error handling middleware with logging
app.use((err, req, res, next) => {
  // Log the error with timestamp and request details
  const timestamp = new Date().toISOString();
  console.error(`❌ [${timestamp}] Global error handler:`, {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation error',
      error: isDevelopment ? err.message : 'Invalid input data'
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid ID format',
      error: isDevelopment ? err.message : 'Invalid resource ID'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      success: false, 
      message: 'Duplicate entry',
      error: isDevelopment ? err.message : 'Resource already exists'
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Handle CORS errors
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Something went wrong!',
    error: isDevelopment ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

// Start server with error handling
const httpServer = server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err);
  }
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('🔴 Received shutdown signal, closing server...');
  httpServer.close(() => {
    console.log('🔴 Server closed');
    // Supabase doesn't need explicit connection closing
    process.exit(0);
  });
};

// Global error handlers for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Make io available to routes
app.set('io', io);

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
