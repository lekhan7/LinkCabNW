const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss');
const hpp = require('hpp');

// Rate limiting for admin routes
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true // Important for deployment
});

// Rate limiting for sensitive operations
const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 sensitive operations per hour
  message: {
    success: false,
    message: 'Too many sensitive operations, please try again later.'
  },
  skipSuccessfulRequests: true,
  trustProxy: true // Important for deployment
});

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    });
  }

  // Skip query parameter sanitization for now due to Express compatibility
  // if (req.query) {
  //   Object.keys(req.query).forEach(key => {
  //     if (typeof req.query[key] === 'string') {
  //       req.query[key] = xss(req.query[key]);
  //     }
  //   });
  // }

  next();
};

// Admin activity logger
const logAdminActivity = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log admin activities
    if (req.admin || (req.user && (req.user.email === "admin@gmail.com" || req.user.email === "ktkarumbaiah@gmail.com"))) {
      const admin = req.admin || req.user;
      console.log(`[ADMIN ACTIVITY] ${req.method} ${req.originalUrl} - Admin: ${admin.email || admin.phoneNumber} - IP: ${req.ip}`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Validate admin permissions for specific actions
const validateAdminAction = (action) => {
  return (req, res, next) => {
    const user = req.admin || req.user;
    
    if (!user || (user.email !== "admin@gmail.com" && user.email !== "ktkarumbaiah@gmail.com")) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check specific permissions
    const permissionMap = {
      'manage-users': 'canManageUsers',
      'manage-settings': 'canManageSettings',
      'manage-content': 'canManageContent',
      'view-analytics': 'canViewAnalytics'
    };

    const requiredPermission = permissionMap[action];
    if (requiredPermission && !user.adminPermissions[requiredPermission]) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Permission '${requiredPermission}' required.`
      });
    }

    next();
  };
};

// Prevent parameter pollution
const preventParameterPollution = hpp({
  whitelist: ['search', 'verified', 'role', 'page', 'limit']
});

module.exports = {
  adminRateLimit,
  sensitiveRateLimit,
  securityHeaders,
  sanitizeInput,
  logAdminActivity,
  validateAdminAction,
  preventParameterPollution
};
