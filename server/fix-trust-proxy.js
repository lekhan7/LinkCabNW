// Fix for Express trust proxy and rate limiting
// Add this to your server/index.js after app = express() but before any routes

// Trust proxy for rate limiting (fixes X-Forwarded-For error)
app.set('trust proxy', true);

// Rate limiting configuration
const rateLimit = require('express-rate-limit');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Trust proxy headers (important for deployment)
  trustProxy: true
});

// Apply to all routes
app.use(generalLimiter);
