// Debug endpoint to check and fix user roles
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { auth } = require('../middleware/auth');

// Check current user role and info
router.get('/check-role', auth, async (req, res) => {
  try {
    const user = req.user;
    console.log('Current user from auth middleware:', user);
    
    // Double-check role from database
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('id, email, role, name')
      .eq('id', user.id)
      .single();
    
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: error.message
      });
    }
    
    res.json({
      success: true,
      currentUser: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      databaseUser: dbUser,
      isAdmin: user.email === "admin@gmail.com" || user.email === "ktkarumbaiah@gmail.com",
      message: (user.email === "admin@gmail.com" || user.email === "ktkarumbaiah@gmail.com") ? 'User has admin privileges' : 'User does not have admin privileges'
    });
  } catch (err) {
    console.error('Error in check-role:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// List all users (admin only)
router.get('/list-users', auth, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com" && req.user.email !== "ktkarumbaiah@gmail.com") {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, name, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: error.message
      });
    }
    
    res.json({
      success: true,
      users: users,
      adminCount: users.filter(u => u.email === "admin@gmail.com" || u.email === "ktkarumbaiah@gmail.com").length,
      userCount: users.filter(u => u.email !== "admin@gmail.com" && u.email !== "ktkarumbaiah@gmail.com").length
    });
  } catch (err) {
    console.error('Error in list-users:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
