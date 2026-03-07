const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');
const indexExports = require('../index');
const io = indexExports.io;

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

// Get reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:users(id, name, email),
        reviewee:users(id, name, email),
        ride:announcements(id, start_location_name, destination_name, price)
      `)
      .or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Get reviews for a ride
router.get('/ride/:rideId', async (req, res) => {
  try {
    const { rideId } = req.params;
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:users(id, name, email),
        reviewee:users(id, name, email)
      `)
      .eq('ride_id', rideId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get ride reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride reviews'
    });
  }
});

// Create new review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { reviewee_id, ride_id, rating, feedback } = req.body;

    if (!reviewee_id || !ride_id || !rating || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: reviewee_id, ride_id, rating, feedback'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (reviewee_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review yourself'
      });
    }

    // Check if user already reviewed this ride
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewer_id', req.user.id)
      .eq('ride_id', rideId)
      .single();

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this ride'
      });
    }

    const reviewData = {
      reviewer_id: req.user.id,
      reviewee_id,
      ride_id,
      rating: parseInt(rating),
      feedback
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select(`
        *,
        reviewer:users(id, name, email),
        reviewee:users(id, name, email),
        ride:announcements(id, start_location_name, destination_name)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: data
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
});

// Update review
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const reviewId = req.params.id;

    // Check if review exists and belongs to user
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('reviewer_id', req.user.id)
      .single();

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to update it'
      });
    }

    const updateData = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      updateData.rating = parseInt(rating);
    }
    if (feedback !== undefined) {
      updateData.feedback = feedback;
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select(`
        *,
        reviewer:users(id, name, email),
        reviewee:users(id, name, email),
        ride:announcements(id, start_location_name, destination_name)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: data
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
});

// Delete review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;

    // Check if review exists and belongs to user
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('reviewer_id', req.user.id)
      .single();

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

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

// Submit review using the new database function
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { 
      announcementId, 
      revieweeId, 
      rating, 
      feedback
    } = req.body;

    if (!announcementId || !revieweeId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: announcementId, revieweeId, rating'
      });
    }

    // First try the RPC function
    console.log('🔍 Attempting to submit review with data:', {
      announcementId,
      revieweeId,
      rating,
      feedback,
      reviewerId: req.user.id
    });

    let { data: result, error } = await supabase
      .rpc('submit_review', { 
        ride_uuid: announcementId,
        reviewer_uuid: req.user.id,
        reviewee_uuid: revieweeId,
        rating: rating,
        feedback: feedback
      });

    console.log('📊 RPC function result:', { result, error });

    // If RPC function doesn't exist, use fallback logic
    if (error && error.message.includes('function "submit_review" does not exist')) {
      console.log('RPC function not found, using fallback logic...');
      
      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('*')
        .eq('ride_id', announcementId)
        .eq('reviewer_id', req.user.id)
        .eq('reviewee_id', revieweeId)
        .single();

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this user for this ride'
        });
      }

      // Insert the review directly into the correct reviews table
      console.log('🔄 Using fallback logic to insert review...');
      const { data: newReview, error: insertError } = await supabase
        .from('reviews')
        .insert({
          ride_id: announcementId,
          reviewer_id: req.user.id,
          reviewee_id: revieweeId,
          rating: rating,
          feedback: feedback,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('💾 Insert result:', { newReview, insertError });

      if (insertError) {
        console.error('Failed to submit review:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Failed to submit review'
        });
      }

      console.log('✅ Review inserted successfully, updating user ratings...');

      // Update the reviewee's average rating using the correct reviews table
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', revieweeId);

      console.log('📈 Found reviews for rating calculation:', reviews.length);

      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      const updateResult = await supabase
        .from('users')
        .update({
          average_rating: averageRating,
          total_reviews: reviews.length
        })
        .eq('id', revieweeId);

      console.log('🔄 User rating update result:', updateResult);

      result = { success: true, new_average_rating: averageRating };
      error = null;
    }

    if (error) {
      console.error('❌ RPC function failed:', error);
      console.log('🔍 Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to submit review'
      });
    }

    if (!result.success) {
      console.error('❌ Function returned failure:', result);
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to submit review'
      });
    }

    console.log('🎉 Review submission successful:', result);

    // Send real-time notification to reviewee
    if (io) {
      io.to(`user-${revieweeId}`).emit('new_review', {
        type: 'NEW_REVIEW',
        title: 'You received a new review! ⭐',
        message: `${req.user.name || 'A user'} reviewed you for your recent ride`,
        rating: rating,
        feedback: feedback,
        announcement_id: announcementId,
        reviewer_name: req.user.name
      });
    }

    // Create notification in database
    try {
      const notificationResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/notifications/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`
        },
        body: JSON.stringify({
          recipientId: revieweeId,
          reviewerName: req.user.name || 'A user',
          rating: rating,
          feedback: feedback,
          announcementId: announcementId
        })
      });
      
      if (!notificationResponse.ok) {
        console.error('Failed to create review notification:', notificationResponse.statusText);
      }
    } catch (notifError) {
      console.error('Error creating review notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        new_average_rating: result.new_average_rating
      }
    });

  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
});

// Get users that can be reviewed for a ride
router.get('/:rideId/reviewable-users', authenticateToken, async (req, res) => {
  try {
    console.log("🔍 Reviewable Users API called");
    console.log("📍 Ride ID:", req.params.rideId);
    console.log("👤 Current user:", req.user?.id);

    const { rideId } = req.params;
    
    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: "Ride ID is required"
      });
    }

    console.log("🔍 Querying announcement_participants for ride:", rideId);

    const { data, error } = await supabase
      .from("announcement_participants")
      .select(`
        id,
        user_id,
        users (
          id,
          name,
          phone_number,
          profile_picture
        )
      `)
      .eq("announcement_id", rideId)
      .eq("status", "accepted");

    console.log("📊 Query result:", { data, error });

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({
        success: false,
        message: "Database query failed"
      });
    }

    console.log("👥 Found participants:", data?.length || 0);

    // Filter out current user from the results
    const reviewableUsers = data.filter(request => request.user_id !== req.user.id);

    console.log("🎯 Reviewable users after filtering:", reviewableUsers.length);

    return res.json({
      success: true,
      users: reviewableUsers
    });

  } catch (err) {
    console.error("Reviewable users error:", err);
    
    res.status(500).json({
      success: false,
      message: "Failed to get reviewable users"
    });
  }
});

// Get report categories
router.get('/report-categories', authenticateToken, async (req, res) => {
  try {
    const categories = [
      { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
      { value: 'no_show', label: 'No Show' },
      { value: 'late_arrival', label: 'Late Arrival' },
      { value: 'unsafe_driving', label: 'Unsafe Driving' },
      { value: 'payment_issue', label: 'Payment Issue' },
      { value: 'communication_issue', label: 'Communication Issue' },
      { value: 'other', label: 'Other' }
    ];

    const severities = [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' }
    ];

    res.json({
      success: true,
      data: {
        categories,
        severities
      }
    });

  } catch (error) {
    console.error('Get report categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report categories'
    });
  }
});

module.exports = router;
