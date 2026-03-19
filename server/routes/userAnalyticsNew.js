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

    // Simple count queries without complex joins
    const { count: ridesCreated, error: ridesCreatedError } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);

    const { count: ridesJoined, error: ridesJoinedError } = await supabase
      .from('announcement_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'accepted');

    const { count: reviewsReceived, error: reviewsError } = await supabase
      .from('review_details')
      .select('*', { count: 'exact', head: true })
      .eq('reviewee_id', userId);

    const { count: reportsReceived, error: reportsError } = await supabase
      .from('review_details')
      .select('*', { count: 'exact', head: true })
      .eq('reviewee_id', userId)
      .not('report_type', 'is', null);

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

// Get reviews per announcement - FIXED VERSION
router.get('/reviews-by-announcement', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📋 Fetching reviews by announcement for user:', userId);

    // Simple query without complex joins to avoid errors
    const { data: reviews, error: reviewsError } = await supabase
      .from('review_details')
      .select('*')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Failed to fetch reviews by announcement:', reviewsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews'
      });
    }

    // Get announcement details separately
    const announcementIds = [...new Set(reviews.map(r => r.announcement_id).filter(id => id))];
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('id, start_location_name, destination_name, date, time')
      .in('id', announcementIds);

    if (announcementsError) {
      console.error('Failed to fetch announcements:', announcementsError);
    }

    // Get reviewer details separately  
    const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id).filter(id => id))];
    const { data: reviewers, error: reviewersError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', reviewerIds);

    if (reviewersError) {
      console.error('Failed to fetch reviewers:', reviewersError);
    }

    // Group reviews by announcement
    const reviewsByAnnouncement = {};
    
    reviews.forEach(review => {
      const announcementId = review.announcement_id;
      const announcement = announcements?.find(a => a.id === announcementId);
      const reviewer = reviewers?.find(r => r.id === review.reviewer_id);
      
      if (!reviewsByAnnouncement[announcementId]) {
        reviewsByAnnouncement[announcementId] = {
          announcement: announcement || { id: announcementId, start_location_name: 'Unknown', destination_name: 'Unknown', date: null, time: null },
          reviews: []
        };
      }
      
      reviewsByAnnouncement[announcementId].reviews.push({
        reviewerName: reviewer?.name || 'Anonymous',
        starsGiven: review.stars || review.rating || 0,
        reviewDescription: review.review_description || '',
        reportType: review.report_type || '',
        reportDescription: review.report_description || '',
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
