const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user is admin
    if (req.user.email !== "admin@gmail.com" && req.user.email !== "ktkarumbaiah@gmail.com") {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify admin access'
    });
  }
};

// Get all reviews for admin
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const { 
      search = '', 
      rating = '',
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(id, name, email, phone_number),
        reviewee:users!reviews_reviewee_id_fkey(id, name, email, phone_number),
        announcement:announcements(id, start_location_name, destination_name, date, time)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`reviewer.name.ilike.%${search}%,reviewee.name.ilike.%${search}%,feedback.ilike.%${search}%`);
    }
    
    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch reviews:', error);
      // Fallback to basic query
      const fallbackQuery = supabase
        .from('reviews')
        .select('*', { count: 'exact' });

      if (search) {
        fallbackQuery = fallbackQuery.or(`feedback.ilike.%${search}%`);
      }
      
      if (rating) {
        fallbackQuery = fallbackQuery.eq('rating', parseInt(rating));
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
    console.error('Get admin reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Delete review (admin only)
router.delete('/:reviewId', auth, requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Failed to delete review:', error);
      throw error;
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

module.exports = router;
