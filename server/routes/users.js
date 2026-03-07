const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await UserService.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, profilePicture } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (profilePicture !== undefined) updateData.profile_picture = profilePicture;

    const updatedUser = await UserService.updateById(req.user.id, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user with password (using the authenticated user's ID)
    const user = await UserService.findByIdWithPassword(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await UserService.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await UserService.updateById(req.user.id, { password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Get user connections
router.get('/connections', auth, async (req, res) => {
  try {
    // First get the connection requests
    const { data: requests, error: requestError } = await supabase
      .from('connection_requests')
      .select(`
        *,
        announcement_id
      `)
      .or(`(from_user_id.eq.${req.user.id},status.eq.accepted),(to_user_id.eq.${req.user.id},status.eq.accepted)`);

    if (requestError) throw requestError;

    // Then get user details separately for each connection
    const transformedData = [];
    
    for (const connection of requests) {
      const otherUserId = connection.from_user_id === req.user.id ? connection.to_user_id : connection.from_user_id;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, code_number, phone_number, profile_picture, average_rating, completed_trips, total_trips, is_online, last_active')
        .eq('id', otherUserId)
        .single();
      
      if (!userError && userData) {
        transformedData.push({
          id: userData.id,
          name: userData.name,
          email: userData.code_number, // Use code_number as email alternative
          phone: userData.phone_number,
          profile_picture: userData.profile_picture,
          rating: userData.average_rating || 0,
          totalTrips: userData.total_trips || 0,
          status: userData.is_online ? 'active' : 'inactive',
          joinDate: connection.created_at,
          lastTrip: userData.last_active,
          reliability: Math.round((userData.average_rating || 0) * 20), // Convert rating to percentage
          preferredRoutes: [], // This would need to be populated from user preferences
          announcementId: connection.announcement_id // Include announcement ID for ride context
        });
      }
    }

    res.json({
      success: true,
      data: transformedData,
      message: 'User connections retrieved successfully'
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections'
    });
  }
});

// Get pending connection requests
router.get('/pending-requests', auth, async (req, res) => {
  try {
    // First get the connection requests
    const { data: requests, error: requestError } = await supabase
      .from('connection_requests')
      .select(`
        *,
        announcement_id
      `)
      .eq('to_user_id', req.user.id)
      .eq('status', 'pending');

    if (requestError) throw requestError;

    // Then get user details separately for each request
    const transformedData = [];
    
    for (const request of requests) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, code_number, phone_number, profile_picture, average_rating, completed_trips, total_trips, is_online, last_active')
        .eq('id', request.from_user_id)
        .single();
      
      if (!userError && userData) {
        transformedData.push({
          id: request.id,
          name: userData.name,
          email: userData.code_number, // Use code_number as email alternative
          phone: userData.phone_number,
          profile_picture: userData.profile_picture,
          rating: userData.average_rating || 0,
          totalTrips: userData.total_trips || 0,
          status: userData.is_online ? 'active' : 'inactive',
          joinDate: request.created_at,
          lastTrip: userData.last_active,
          reliability: Math.round((userData.average_rating || 0) * 20), // Convert rating to percentage
          preferredRoutes: [], // This would need to be populated from user preferences
          message: request.message || 'Would like to connect with you',
          proposedRoute: 'Route details would be here', // This would come from announcement data
          requestDate: request.created_at,
          announcementId: request.announcement_id // Include announcement ID for ride context
        });
      }
    }

    res.json({
      success: true,
      data: transformedData,
      message: 'Pending requests retrieved successfully'
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests'
    });
  }
});

// Respond to connection request
router.put('/connections/:requestId/:action', auth, async (req, res) => {
  try {
    const { requestId, action } = req.params;
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be accept or reject'
      });
    }

    const { data, error } = await supabase
      .from('connection_requests')
      .update({ status: action })
      .eq('id', requestId)
      .eq('to_user_id', req.user.id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      data: data[0],
      message: `Connection request ${action}ed successfully`
    });
  } catch (error) {
    console.error('Respond to connection request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to connection request'
    });
  }
});

// Remove connection
router.delete('/connections/:coPassengerId', auth, async (req, res) => {
  try {
    const { coPassengerId } = req.params;

    const { data, error } = await supabase
      .from('connection_requests')
      .delete()
      .or(`(from_user_id.eq.${req.user.id},to_user_id.eq.${coPassengerId}),(to_user_id.eq.${req.user.id},from_user_id.eq.${coPassengerId})`);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Connection removed successfully'
    });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove connection'
    });
  }
});

// Get user by ID (public profile) - MUST BE LAST
router.get('/:id', async (req, res) => {
  try {
    const user = await UserService.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if requester is authenticated (has valid token)
    const authHeader = req.headers.authorization;
    let isAuthenticated = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        if (!authError && authData.user) {
          isAuthenticated = true;
        }
      } catch (err) {
        // Token invalid, continue with public profile
      }
    }

    // If authenticated, return full user data (except password)
    // If not authenticated, return limited public information
    if (isAuthenticated) {
      const { password, ...fullProfile } = user;
      res.json({
        success: true,
        data: fullProfile
      });
    } else {
      const publicProfile = {
        id: user.id,
        name: user.name,
        average_rating: user.average_rating,
        completed_trips: user.completed_trips,
        total_trips: user.total_trips,
        is_online: user.is_online,
        last_active: user.last_active
      };

      res.json({
        success: true,
        data: publicProfile
      });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

module.exports = router;
