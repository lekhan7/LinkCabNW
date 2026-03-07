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

// Get user's analytics dashboard with 4 main statistics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 Fetching analytics dashboard for user:', userId);

    // TASK 5: Fetch Rides Created - Count rides created by the logged-in user
    const { count: ridesCreated, error: ridesCreatedError } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);

    if (ridesCreatedError) {
      console.error('Failed to fetch rides created:', ridesCreatedError);
    }

    // TASK 6: Fetch Rides Joined - Count rides where user joined someone else's ride
    const { count: ridesJoined, error: ridesJoinedError } = await supabase
      .from('announcement_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (ridesJoinedError) {
      console.error('Failed to fetch rides joined:', ridesJoinedError);
    }

    // TASK 7: Fetch Reviews Received - Count all reviews related to rides created by the current user
    const { count: reviewsReceived, error: reviewsError } = await supabase
      .from('review_details')
      .select('*', { count: 'exact', head: true })
      .eq('reviewee_id', userId);

    if (reviewsError) {
      console.error('Failed to fetch reviews received:', reviewsError);
    }

    // TASK 8: Fetch Reports Received - Count reviews where report_type is not null
    const { count: reportsReceived, error: reportsError } = await supabase
      .from('review_details')
      .select('*', { count: 'exact', head: true })
      .eq('reviewee_id', userId)
      .not('report_type', 'is', null);

    if (reportsError) {
      console.error('Failed to fetch reports received:', reportsError);
    }

    const dashboardData = {
      totalRidesCreated: ridesCreated || 0,
      totalRidesJoined: ridesJoined || 0,
      totalReviewsReceived: reviewsReceived || 0,
      totalReportsReceived: reportsReceived || 0
    };

    console.log('✅ Dashboard analytics fetched:', dashboardData);

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics'
    });
  }
});

// TASK 9: Show Reviews Per Announcement - Get reviews grouped by announcement
router.get('/reviews-by-announcement', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📋 Fetching reviews by announcement for user:', userId);

    // Get reviews for rides created by the current user, grouped by announcement
    const { data: reviews, error: reviewsError } = await supabase
      .from('review_details')
      .select(`
        *,
        reviewer:users!review_details_user_id_fkey (name),
        announcement:announcements(id, start_location_name, destination_name, date, time)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Failed to fetch reviews by announcement:', reviewsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews'
      });
    }

    // Group reviews by announcement
    const reviewsByAnnouncement = {};
    
    reviews.forEach(review => {
      const announcementId = review.announcement_id;
      const announcement = review.announcement;
      
      if (!reviewsByAnnouncement[announcementId]) {
        reviewsByAnnouncement[announcementId] = {
          announcement: announcement,
          reviews: []
        };
      }
      
      reviewsByAnnouncement[announcementId].reviews.push({
        reviewerName: review.reviewer?.name || 'Anonymous',
        starsGiven: review.stars,
        reviewDescription: review.review_description,
        reportType: review.report_type,
        reportDescription: review.report_description,
        dateOfReview: review.created_at
      });
    });

    console.log('✅ Reviews grouped by announcement:', Object.keys(reviewsByAnnouncement).length);

    res.json({
      success: true,
      data: reviewsByAnnouncement
    });

  } catch (error) {
    console.error('Get reviews by announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews by announcement'
    });
  }
});

module.exports = router;
