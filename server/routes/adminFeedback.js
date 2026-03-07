const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all feedback for admin
router.get('/', auth, adminAuth, async (req, res) => {
  console.log('Admin feedback route called');
  console.log('User ID from auth:', req.user?.id);
  
  try {
    const { page = 1, limit = 20, search, rating, status, priority, feedback_type } = req.query;
    const offset = (page - 1) * limit;

    console.log('Query params:', { page, limit, search, rating, status, priority, feedback_type });

    // Build query for feedback table - simplified version first
    let query = supabase
      .from('feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`subject.ilike.%${search}%,message.ilike.%${search}%`);
    }
    
    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (feedback_type) {
      query = query.eq('feedback_type', feedback_type);
    }

    console.log('Executing query...');
    const { data: feedback, error, count } = await query;

    if (error) {
      console.error('Supabase error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        error: error.message
      });
    }

    console.log('Query successful, feedback count:', feedback?.length || 0);

    // Initialize feedbackStats
    let feedbackStats = {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      statusDistribution: {},
      priorityDistribution: {},
      typeDistribution: {}
    };

    // Get statistics
    console.log('Fetching statistics...');
    const { data: stats, error: statsError } = await supabase
      .from('feedback')
      .select('rating, status, priority, feedback_type', { count: 'exact' });

    if (statsError) {
      console.error('Stats error details:', JSON.stringify(statsError, null, 2));
      // Continue with empty stats if stats query fails
    } else if (stats && stats.length > 0) {
      const ratingCounts = {};
      const statusCounts = {};
      const priorityCounts = {};
      const typeCounts = {};
      const totalFeedback = stats.length;
      let totalRating = 0;
      let ratingCount = 0;
      
      // Count ratings by star level
      for (let i = 1; i <= 5; i++) {
        ratingCounts[i] = stats.filter(r => r.rating === i).length;
      }

      // Count by status
      stats.forEach(s => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      });

      // Count by priority
      stats.forEach(s => {
        priorityCounts[s.priority] = (priorityCounts[s.priority] || 0) + 1;
      });

      // Count by type
      stats.forEach(s => {
        typeCounts[s.feedback_type] = (typeCounts[s.feedback_type] || 0) + 1;
      });

      // Calculate average rating (only count feedback with ratings)
      const feedbackWithRatings = stats.filter(s => s.rating !== null);
      if (feedbackWithRatings.length > 0) {
        totalRating = feedbackWithRatings.reduce((sum, r) => sum + r.rating, 0);
        ratingCount = feedbackWithRatings.length;
      }

      feedbackStats = {
        totalFeedback,
        averageRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0,
        ratingDistribution: ratingCounts,
        statusDistribution: statusCounts,
        priorityDistribution: priorityCounts,
        typeDistribution: typeCounts
      };
    }

    console.log('Feedback stats calculated:', feedbackStats);

    res.json({
      success: true,
      data: feedback || [],
      stats: feedbackStats || {
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        statusDistribution: {},
        priorityDistribution: {},
        typeDistribution: {}
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error in feedback endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete feedback (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Error deleting feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete feedback'
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update feedback status (admin only)
router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status, admin_response } = req.body;
    const adminId = req.user.id;

    // Validate feedback_type - include popup form types
    const validTypes = ['bug_report', 'feature_request', 'general_feedback', 'complaint', 'suggestion', 'compliment'];
    if (!validTypes.includes(req.query.feedback_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback_type. Must be one of: ' + validTypes.join(', ')
      });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      admin_id: adminId
    };

    // Add admin response if provided
    if (admin_response !== undefined) {
      updateData.admin_response = admin_response;
    }

    // Set resolved_at timestamp if status is resolved
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feedback status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update feedback status'
      });
    }

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data
    });

  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single feedback by ID (admin only)
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select(`
        *,
        user:users!feedback_user_id_fkey (name, email, phone_number),
        admin:users!feedback_admin_id_fkey (name, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('Error fetching feedback:', error);
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
