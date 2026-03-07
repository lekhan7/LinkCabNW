const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { auth } = require('../middleware/auth');

// Submit new feedback (authenticated users)
router.post('/', auth, async (req, res) => {
  try {
    const { 
      rating, 
      feedback_type, 
      subject, 
      message, 
      priority = 'medium' 
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!feedback_type || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'feedback_type, subject, and message are required'
      });
    }

    // Validate feedback_type - include popup form types
    const validTypes = ['bug_report', 'feature_request', 'general_feedback', 'complaint', 'suggestion', 'compliment'];
    if (!validTypes.includes(feedback_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback_type. Must be one of: ' + validTypes.join(', ')
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be one of: ' + validPriorities.join(', ')
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        rating: rating || null,
        feedback_type,
        subject,
        message,
        priority,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit feedback'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user's feedback
router.get('/my-feedback', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let query = supabase
      .from('feedback')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: feedback, error, count } = await query;

    if (error) {
      console.error('Error fetching user feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }

    res.json({
      success: true,
      data: feedback || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single feedback by ID (user must own it)
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      console.error('Error fetching feedback:', error);
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or access denied'
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
