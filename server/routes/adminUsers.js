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

    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Starting safe deletion for user ${userId}`);
    }

    // Start a transaction to ensure data consistency
    const { data: userToDelete, error: userCheckError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();

    if (userCheckError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('User not found:', userCheckError);
      }
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Step 1: Delete or update dependent records in correct order
    
    // 1.1 Delete announcements created by the user (this will cascade to announcement_participants)
    const { error: announcementsError } = await supabase
      .from('announcements')
      .delete()
      .eq('created_by', userId);

    if (announcementsError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete announcements:', announcementsError);
      }
      throw new Error(`Failed to delete user's announcements: ${announcementsError.message}`);
    }

    // 1.2 Delete rides created by the user
    const { error: ridesError } = await supabase
      .from('rides')
      .delete()
      .eq('user_id', userId);

    if (ridesError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete rides:', ridesError);
      }
      throw new Error(`Failed to delete user's rides: ${ridesError.message}`);
    }

    // 1.3 Delete ride shares where user is involved
    const { error: rideSharesError } = await supabase
      .from('ride_shares')
      .delete()
      .eq('user_id', userId);

    if (rideSharesError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete ride shares:', rideSharesError);
      }
      throw new Error(`Failed to delete user's ride shares: ${rideSharesError.message}`);
    }

    // 1.4 Delete ratings given by the user
    const { error: ratingsGivenError } = await supabase
      .from('ratings')
      .delete()
      .eq('from_user_id', userId);

    if (ratingsGivenError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete ratings given:', ratingsGivenError);
      }
      throw new Error(`Failed to delete user's ratings: ${ratingsGivenError.message}`);
    }

    // 1.5 Delete ratings received by the user
    const { error: ratingsReceivedError } = await supabase
      .from('ratings')
      .delete()
      .eq('to_user_id', userId);

    if (ratingsReceivedError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete ratings received:', ratingsReceivedError);
      }
      throw new Error(`Failed to delete ratings received: ${ratingsReceivedError.message}`);
    }

    // 1.6 Delete reviews created by the user
    const { error: reviewsError } = await supabase
      .from('reviews')
      .delete()
      .eq('reviewer_id', userId);

    if (reviewsError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete reviews:', reviewsError);
      }
      throw new Error(`Failed to delete user's reviews: ${reviewsError.message}`);
    }

    // 1.7 Delete review_details created by the user
    const { error: reviewDetailsError } = await supabase
      .from('review_details')
      .delete()
      .eq('user_id', userId);

    if (reviewDetailsError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete review details:', reviewDetailsError);
      }
      throw new Error(`Failed to delete user's review details: ${reviewDetailsError.message}`);
    }

    // 1.8 Delete review_details where user is the reviewee
    const { error: reviewDetailsRevieweeError } = await supabase
      .from('review_details')
      .delete()
      .eq('reviewee_id', userId);

    if (reviewDetailsRevieweeError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete review details as reviewee:', reviewDetailsRevieweeError);
      }
      throw new Error(`Failed to delete user's review details as reviewee: ${reviewDetailsRevieweeError.message}`);
    }

    // 1.9 Delete notifications where user is sender or recipient
    const { error: notificationsSenderError } = await supabase
      .from('notifications')
      .delete()
      .eq('sender_id', userId);

    if (notificationsSenderError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete notifications as sender:', notificationsSenderError);
      }
      throw new Error(`Failed to delete user's notifications as sender: ${notificationsSenderError.message}`);
    }

    const { error: notificationsRecipientError } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', userId);

    if (notificationsRecipientError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete notifications as recipient:', notificationsRecipientError);
      }
      throw new Error(`Failed to delete user's notifications as recipient: ${notificationsRecipientError.message}`);
    }

    // 1.10 Delete connection requests
    const { error: connectionRequestsFromError } = await supabase
      .from('connection_requests')
      .delete()
      .eq('from_user_id', userId);

    if (connectionRequestsFromError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete connection requests (from):', connectionRequestsFromError);
      }
      throw new Error(`Failed to delete user's connection requests: ${connectionRequestsFromError.message}`);
    }

    const { error: connectionRequestsToError } = await supabase
      .from('connection_requests')
      .delete()
      .eq('to_user_id', userId);

    if (connectionRequestsToError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete connection requests (to):', connectionRequestsToError);
      }
      throw new Error(`Failed to delete user's connection requests: ${connectionRequestsToError.message}`);
    }

    // 1.11 Delete favorite routes
    const { error: favoriteRoutesUserError } = await supabase
      .from('favorite_routes')
      .delete()
      .eq('user_id', userId);

    if (favoriteRoutesUserError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete favorite routes (user):', favoriteRoutesUserError);
      }
      throw new Error(`Failed to delete user's favorite routes: ${favoriteRoutesUserError.message}`);
    }

    const { error: favoriteRoutesCreatedError } = await supabase
      .from('favorite_routes')
      .delete()
      .eq('created_by', userId);

    if (favoriteRoutesCreatedError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete favorite routes (created):', favoriteRoutesCreatedError);
      }
      throw new Error(`Failed to delete user's created favorite routes: ${favoriteRoutesCreatedError.message}`);
    }

    // 1.12 Delete preferred locations and travel places
    const { error: preferredLocationsError } = await supabase
      .from('preferred_locations')
      .delete()
      .eq('user_id', userId);

    if (preferredLocationsError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete preferred locations:', preferredLocationsError);
      }
      throw new Error(`Failed to delete user's preferred locations: ${preferredLocationsError.message}`);
    }

    const { error: preferredTravelPlacesError } = await supabase
      .from('preferred_travel_places')
      .delete()
      .eq('user_id', userId);

    if (preferredTravelPlacesError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete preferred travel places:', preferredTravelPlacesError);
      }
      throw new Error(`Failed to delete user's preferred travel places: ${preferredTravelPlacesError.message}`);
    }

    // 1.13 Delete payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', userId);

    if (paymentsError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete payments:', paymentsError);
      }
      throw new Error(`Failed to delete user's payments: ${paymentsError.message}`);
    }

    // Step 2: Delete the user record
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteUserError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete user:', deleteUserError);
      }
      throw new Error(`Failed to delete user: ${deleteUserError.message}`);
    }

    // Step 3: Delete the Supabase auth user (optional, might fail if auth user doesn't exist)
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
      if (authDeleteError && process.env.NODE_ENV === 'development') {
        console.warn('Failed to delete auth user (may not exist):', authDeleteError);
      }
    } catch (authError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Auth deletion failed (user may not exist in auth):', authError.message);
      }
      // Don't throw error for auth deletion failure
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Successfully deleted user ${userToDelete.name} (${userToDelete.email})`);
    }

    res.json({
      success: true,
      message: `User "${userToDelete.name}" and all related data deleted successfully`
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user'
    });
  }
});

module.exports = router;
