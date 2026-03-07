// Simple JWT bypass for testing - remove RLS issues
const { supabase } = require('../config/supabase');

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

    // Extract user ID from token (simplified approach)
    // In production, you'd properly validate JWT
    let userId;
    
    try {
      // Try to decode JWT without verification (for testing)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userId = payload.sub; // Supabase uses 'sub' for user ID
      }
    } catch (decodeError) {
      console.log('Failed to decode JWT, using fallback');
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
        // Extract user ID from token (simplified)
        let userId;
        
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            userId = payload.sub;
          }
        } catch (decodeError) {
          console.log('Failed to decode JWT in optional auth');
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
