const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
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

// Submit review using the new review_details table
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { 
      announcementId, 
      revieweeId, 
      rating, 
      reviewDescription,
      reportType,
      reportDescription
    } = req.body;

    if (!announcementId || !revieweeId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: announcementId, revieweeId, rating'
      });
    }

    console.log('🔍 Submitting review to review_details table:', {
      announcementId,
      revieweeId,
      rating,
      reviewDescription,
      reportType,
      reportDescription,
      reviewerId: req.user.id
    });

    // Insert into review_details table
    const { data: newReview, error: insertError } = await supabaseAdmin
      .from('review_details')
      .insert({
        user_id: req.user.id, // Person writing the review
        reviewee_id: revieweeId, // Person being reviewed
        announcement_id: announcementId, // The ride/announcement
        stars: rating,
        review_description: reviewDescription,
        report_type: reportType,
        report_description: reportDescription
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert review:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit review'
      });
    }

    console.log('✅ Review inserted successfully into review_details:', newReview);

    // Send real-time notification to reviewee
    if (io) {
      io.to(`user-${revieweeId}`).emit('new_review', {
        type: 'NEW_REVIEW',
        title: 'You received a new review for your ride.',
        message: `Reviewer: ${req.user.name || 'A user'}\nRating: ${rating} stars\nReview: ${reviewDescription || 'No description provided'}`,
        rating: rating,
        reviewDescription: reviewDescription,
        announcement_id: announcementId,
        reviewer_name: req.user.name
      });
    }

    // Create notification in database for persistence
    try {
      const { data: notificationData, error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: revieweeId,
          sender_id: req.user.id,
          type: 'NEW_REVIEW',
          title: 'New Ride Review',
          message: `You received a new review for your ride.\n\nReviewer: ${req.user.name || 'A user'}\nStar Rating: ${rating}\nReview Description: ${reviewDescription || 'No description provided'}`,
          announcement_id: announcementId,
          is_read: false,
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Failed to create review notification:', notificationError);
      } else {
        console.log('✅ Review notification created successfully');
      }
    } catch (notifError) {
      console.error('Error creating review notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: newReview
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

    // Get accepted participants (co-passengers)
    const { data: participants, error: participantsError } = await supabase
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

    if (participantsError) {
      console.error("❌ Participants query error:", participantsError);
      return res.status(500).json({
        success: false,
        message: "Failed to query participants"
      });
    }

    console.log("👥 Found participants:", participants?.length || 0);

    // Get the ride creator
    const { data: announcement, error: announcementError } = await supabase
      .from("announcements")
      .select(`
        created_by,
        users!announcements_created_by_fkey (
          id,
          name,
          phone_number,
          profile_picture
        )
      `)
      .eq("id", rideId)
      .single();

    if (announcementError) {
      console.error("❌ Announcement query error:", announcementError);
      return res.status(500).json({
        success: false,
        message: "Failed to query announcement"
      });
    }

    console.log("� Found ride creator:", announcement?.created_by);

    // Combine all reviewable users
    let allReviewableUsers = [];

    // Add participants (co-passengers)
    if (participants && participants.length > 0) {
      allReviewableUsers.push(...participants);
    }

    // Add ride creator if different from current user
    if (announcement && announcement.created_by !== req.user.id) {
      allReviewableUsers.push({
        id: announcement.created_by,
        user_id: announcement.created_by,
        users: announcement.users,
        is_creator: true,
        role: 'creator'
      });
    }

    // Mark participants as co-passengers
    allReviewableUsers = allReviewableUsers.map(user => {
      if (!user.is_creator) {
        return {
          ...user,
          is_creator: false,
          role: 'co-passenger'
        };
      }
      return user;
    });

    console.log("🎯 All reviewable users before filtering:", allReviewableUsers.length);

    // Filter out current user from the results
    const reviewableUsers = allReviewableUsers.filter(request => request.user_id !== req.user.id);

    console.log("🎯 Final reviewable users:", reviewableUsers.length);

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
