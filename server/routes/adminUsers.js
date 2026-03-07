const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // The auth middleware already attached the user from public.users
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user is admin
    if (req.user.email !== "admin@gmail.com" && req.user.email !== "ktkarumbaiah@gmail.com") {
      console.log(`Access denied: user ${req.user.email} is not an admin`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log(`✅ Admin access granted for user ${req.user.id} (${req.user.email})`);
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify admin access'
    });
  }
};

// Get all users for admin management
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const { 
      search = '', 
      role = '', 
      verified = '',
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone_number,
        verified,
        is_phone_verified,
        is_online,
        average_rating,
        completed_trips,
        total_trips,
        role,
        is_premium,
        created_at,
        updated_at,
        last_active,
        profile_picture,
        code_number
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,code_number.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    if (verified !== '') {
      query = query.eq('verified', verified === 'true');
    }

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch users:', error);
      // Fallback to basic user query if relationships fail
      const fallbackQuery = supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone_number,
          verified,
          is_phone_verified,
          is_online,
          average_rating,
          completed_trips,
          total_trips,
          role,
          is_premium,
          created_at,
          updated_at,
          last_active,
          profile_picture,
          code_number
        `, { count: 'exact' });

      if (search) {
        fallbackQuery = fallbackQuery.or(`name.ilike.%${search}%,code_number.ilike.%${search}%,phone_number.ilike.%${search}%`);
      }
      
      if (role) {
        fallbackQuery = fallbackQuery.eq('role', role);
      }
      
      if (verified !== '') {
        fallbackQuery = fallbackQuery.eq('verified', verified === 'true');
      }

      const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (fallbackError) {
        throw fallbackError;
      }

      return res.json({
        success: true,
        data: fallbackData || [],
        pagination: {
          total: fallbackCount || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((fallbackCount || 0) / parseInt(limit))
        }
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user statistics for admin dashboard
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: verifiedUsers },
      { count: adminUsers },
      { count: onlineUsers }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('verified', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).or('email.eq.admin@gmail.com,email.eq.ktkarumbaiah@gmail.com'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_online', true)
    ]);

    res.json({
      success: true,
      data: {
        total_users: totalUsers || 0,
        verified_users: verifiedUsers || 0,
        admin_users: adminUsers || 0,
        online_users: onlineUsers || 0,
        unverified_users: (totalUsers || 0) - (verifiedUsers || 0)
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

// Update user (admin only)
router.put('/:userId', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, verified, is_premium, can_manage_users, can_manage_settings, can_manage_content, can_view_analytics } = req.body;

    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (verified !== undefined) updateData.verified = verified;
    if (is_premium !== undefined) updateData.is_premium = is_premium;
    if (can_manage_users !== undefined) updateData.can_manage_users = can_manage_users;
    if (can_manage_settings !== undefined) updateData.can_manage_settings = can_manage_settings;
    if (can_manage_content !== undefined) updateData.can_manage_content = can_manage_content;
    if (can_view_analytics !== undefined) updateData.can_view_analytics = can_view_analytics;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Remove password from response
    const { password, ...userWithoutPassword } = data;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user (admin only)
router.delete('/:userId', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;
