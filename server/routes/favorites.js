const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Get user's favorite routes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('favorite_routes')
      .select(`
        *,
        announcement:announcements(
          id, 
          start_location_name, 
          destination_name, 
          price, 
          date, 
          time,
          created_by,
          created_by:users(id, name, email, phone_number)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites'
    });
  }
});

// Add route to favorites
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { announcement_id, from_location, to_location } = req.body;

    if (!announcement_id || !from_location || !to_location) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: announcement_id, from_location, to_location'
      });
    }

    // Check if already favorited
    const { data: existingFavorite } = await supabase
      .from('favorite_routes')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('announcement_id', announcement_id)
      .single();

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Route already in favorites'
      });
    }

    const favoriteData = {
      user_id: req.user.id,
      created_by: req.user.id,
      announcement_id,
      from_location,
      to_location
    };

    const { data, error } = await supabase
      .from('favorite_routes')
      .insert(favoriteData)
      .select(`
        *,
        announcement:announcements(
          id, 
          start_location_name, 
          destination_name, 
          price, 
          date, 
          time,
          created_by,
          created_by:users(id, name, email, phone_number)
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Route added to favorites',
      data: data
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites'
    });
  }
});

// Remove from favorites
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const favoriteId = req.params.id;

    // Check if favorite exists and belongs to user
    const { data: existingFavorite } = await supabase
      .from('favorite_routes')
      .select('*')
      .eq('id', favoriteId)
      .eq('user_id', req.user.id)
      .single();

    if (!existingFavorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found or you do not have permission to delete it'
      });
    }

    const { error } = await supabase
      .from('favorite_routes')
      .delete()
      .eq('id', favoriteId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Route removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites'
    });
  }
});

// Check if route is favorited
router.get('/check/:announcementId', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;

    const { data, error } = await supabase
      .from('favorite_routes')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('announcement_id', announcementId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      success: true,
      isFavorited: !!data,
      data: data
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status'
    });
  }
});

// Go Ride - Send notification to announcement creator
router.post('/go-ride/:announcementId', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    // Check if user has this ride in favorites
    const { data: favorite } = await supabase
      .from('favorite_routes')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('announcement_id', announcementId)
      .single();
    
    if (!favorite) {
      return res.status(400).json({
        success: false,
        message: 'You must favorite this ride first'
      });
    }
    
    // Get announcement details
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select(`
        *,
        created_by:users(id, name, email, phone_number)
      `)
      .eq('id', announcementId)
      .single();
    
    if (announcementError || !announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    // Check if user is trying to go-ride their own announcement
    if (announcement.created_by === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot go-ride your own announcement'
      });
    }
    
    // Create notification for announcement creator
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: announcement.created_by,
        sender_id: req.user.id,
        type: 'go_ride_request',
        title: 'Someone wants to join your favorite route!',
        message: `${req.user.name || 'A user'} is interested in your route from ${announcement.start_location_name} to ${announcement.destination_name}. Are you willing to go together?`,
        announcement_id: announcementId,
        status: 'pending'
      })
      .select()
      .single();
    
    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }
    
    // Emit real-time notification if socket.io is available
    const indexExports = require('../index');
    const io = indexExports.io;
    if (io && io.to) {
      io.to(`user-${announcement.created_by}`).emit('notification', {
        type: 'go_ride_request',
        title: 'Someone wants to join your favorite route!',
        message: `${req.user.name || 'A user'} is interested in your route from ${announcement.start_location_name} to ${announcement.destination_name}. Are you willing to go together?`,
        data: {
          announcement_id: announcementId,
          sender: {
            id: req.user.id,
            name: req.user.name
          }
        }
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Go-ride request sent successfully!',
      notification: notification || null
    });
    
  } catch (error) {
    console.error('Go ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send go-ride request'
    });
  }
});

module.exports = router;
