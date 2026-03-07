const jwt = require('jsonwebtoken');

/**
 * Generate JWT token with proper error handling
 * @param {string} userId - User ID to include in token
 * @returns {string} JWT token
 * @throws {Error} If JWT_SECRET is missing or token generation fails
 */
const generateToken = (userId) => {
  // Check if JWT_SECRET exists
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is missing from environment variables');
    throw new Error('JWT_SECRET environment variable is required for token generation');
  }

  // Log JWT_SECRET existence (never log the actual secret)
  console.log('✅ JWT_SECRET loaded:', !!process.env.JWT_SECRET);
  
  try {
    const token = jwt.sign(
      { id: userId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '5d' }
    );
    
    console.log('✅ Token generated successfully for user:', userId, 'expires in 5 days');
    return token;
  } catch (error) {
    console.error('❌ Token generation failed:', error.message);
    throw new Error('Failed to generate authentication token');
  }
};

module.exports = { generateToken };
