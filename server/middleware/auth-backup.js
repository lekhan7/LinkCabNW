const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("Incoming token:", token.substring(0, 20) + "...");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format"
      });
    }

    // Verify token using Supabase - handle JWT errors gracefully
    let userData;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('Supabase auth error:', error);
        
        // Handle specific JWT errors
        if (error.message?.includes('invalid JWT') || error.code === 'bad_jwt') {
          console.log('JWT token invalid, trying to refresh...');
          
          // Try to refresh the session
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: token });
            
            if (refreshError || !refreshData.session) {
              return res.status(401).json({
                success: false,
                message: "Token expired and refresh failed. Please login again."
              });
            }
            
            userData = refreshData.user;
            console.log('Token refreshed successfully');
          } catch (refreshError) {
            return res.status(401).json({
              success: false,
              message: "Token validation failed. Please login again."
            });
          }
        } else {
          return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
          });
        }
      } else {
        userData = data.user;
      }
    } catch (jwtError) {
      console.error('JWT processing error:', jwtError);
      return res.status(401).json({
        success: false,
        message: "Token validation failed"
      });
    }

    if (!userData) {
      return res.status(401).json({
        success: false,
        message: "User not found in auth system"
      });
    }

    req.user = userData;
    
    // Get user details from database
    const { data: dbUserData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.id)
      .single();
    
    if (userError || !dbUserData) {
      console.error('Database user error:', userError);
      console.error('JWT user_id from Supabase:', userData.id);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found in public.users table.' 
      });
    }

    // Temporarily allow users without phone verification for testing
    // if (!dbUserData.is_phone_verified) {
    //   return res.status(401).json({ 
    //     success: false, 
    //     message: 'Account not verified. Please complete OTP verification.' 
    //   });
    // }

    // Remove password from user object
    const { password, ...userWithoutPassword } = dbUserData;
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
        // Verify token using Supabase
        const { data, error } = await supabase.auth.getUser(token);
        
        if (!error && data?.user) {
          // Get user details from database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (userData && !userError && userData.is_phone_verified) {
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
