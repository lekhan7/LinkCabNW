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

// Get ratings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        from_user:users(id, name, email),
        to_user:users(id, name, email),
        announcement:announcements(id, start_location_name, destination_name, price)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
});

// Get ratings for an announcement
router.get('/announcement/:announcementId', async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        from_user:users(id, name, email),
        to_user:users(id, name, email)
      `)
      .eq('announcement_id', announcementId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get announcement ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement ratings'
    });
  }
});

// Create new rating
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { to_user_id, announcement_id, stars, review } = req.body;

    if (!to_user_id || !announcement_id || !stars) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: to_user_id, announcement_id, stars'
      });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({
        success: false,
        message: 'Stars must be between 1 and 5'
      });
    }

    if (to_user_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot rate yourself'
      });
    }

    // Check if user already rated this announcement
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('*')
      .eq('from_user_id', req.user.id)
      .eq('to_user_id', to_user_id)
      .eq('announcement_id', announcement_id)
      .single();

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this user for this announcement'
      });
    }

    const ratingData = {
      from_user_id: req.user.id,
      to_user_id,
      announcement_id,
      stars: parseInt(stars),
      review: review || ''
    };

    const { data, error } = await supabase
      .from('ratings')
      .insert(ratingData)
      .select(`
        *,
        from_user:users(id, name, email),
        to_user:users(id, name, email),
        announcement:announcements(id, start_location_name, destination_name)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      data: data
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create rating'
    });
  }
});

// Update rating
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { stars, review } = req.body;
    const ratingId = req.params.id;

    // Check if rating exists and belongs to user
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('*')
      .eq('id', ratingId)
      .eq('from_user_id', req.user.id)
      .single();

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found or you do not have permission to update it'
      });
    }

    const updateData = {};
    if (stars !== undefined) {
      if (stars < 1 || stars > 5) {
        return res.status(400).json({
          success: false,
          message: 'Stars must be between 1 and 5'
        });
      }
      updateData.stars = parseInt(stars);
    }
    if (review !== undefined) {
      updateData.review = review;
    }

    const { data, error } = await supabase
      .from('ratings')
      .update(updateData)
      .eq('id', ratingId)
      .select(`
        *,
        from_user:users(id, name, email),
        to_user:users(id, name, email),
        announcement:announcements(id, start_location_name, destination_name)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Rating updated successfully',
      data: data
    });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rating'
    });
  }
});

// Delete rating
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const ratingId = req.params.id;

    // Check if rating exists and belongs to user
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('*')
      .eq('id', ratingId)
      .eq('from_user_id', req.user.id)
      .single();

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found or you do not have permission to delete it'
      });
    }

    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('id', ratingId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rating'
    });
  }
});

module.exports = router;
