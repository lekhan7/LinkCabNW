// Simple JWT bypass for testing - remove RLS issues
const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // For now, bypass JWT validation and just get user from database
    // This is a temporary fix to resolve the JWT signature issues
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("Auth middleware: Processing request");

    // Extract user ID from token with proper JWT verification
    let userId;
    
    try {
      // Properly verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id; // JWT uses 'id' field, not 'sub'
      console.log(`✅ JWT verified successfully for user ID: ${userId}`);
    } catch (decodeError) {
      console.error('❌ JWT verification failed:', decodeError.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unable to extract user ID from token"
      });
    }

    console.log(`Looking for user: ${userId}`);

    // Get user details from database (bypassing Supabase auth)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('Database user error:', userError);
      console.error('User ID from token:', userId);
      return res.status(401).json({ 
        success: false, 
        message: 'User not found in database. Please signup first.' 
      });
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = userData;
    req.user = userWithoutPassword;
    
    console.log(`✅ User authenticated: ${req.user.id} (${req.user.email}) with role '${req.user.role}'`);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error in authentication.' 
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      
      if (token) {
        // Extract user ID from token with proper JWT verification
        let userId;
        
        try {
          // Properly verify JWT token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id; // JWT uses 'id' field, not 'sub'
        } catch (decodeError) {
          console.log('Failed to verify JWT in optional auth:', decodeError.message);
        }

        if (userId) {
          // Get user details from database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (userData && !userError) {
            const { password, ...userWithoutPassword } = userData;
            req.user = userWithoutPassword;
          }
        }
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't send errors, just continue without user
    console.error('Optional auth error:', error);
    next();
  }
};

module.exports = { auth, optionalAuth };
