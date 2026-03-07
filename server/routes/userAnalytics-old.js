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

// Get current user's rating analytics
router.get('/ratings', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.user.id;

    // Get rating analytics directly from ratings table
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select('stars, review, created_at, from_user_id')
      .eq('to_user_id', targetUserId);

    if (ratingsError) {
      console.error('Failed to get user rating analytics:', ratingsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to get rating analytics'
      });
    }

    // Calculate analytics from ratings data
    const totalReviews = ratingsData?.length || 0;
    const averageRating = totalReviews > 0 
      ? ratingsData.reduce((sum, r) => sum + r.stars, 0) / totalReviews 
      : 0;

    // Calculate star distribution
    const starDistribution = {
      '5_star': 0,
      '4_star': 0,
      '3_star': 0,
      '2_star': 0,
      '1_star': 0
    };

    ratingsData?.forEach(rating => {
      const key = `${rating.stars}_star`;
      if (starDistribution.hasOwnProperty(key)) {
        starDistribution[key]++;
      }
    });

    // Get completed rides count
    const { count: completedRides, error: ridesError } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', targetUserId)
      .eq('ride_completed', true);

    const analyticsData = {
      total_rides_completed: completedRides || 0,
      average_rating: averageRating.toFixed(1),
      total_reviews_received: totalReviews,
      total_reports_received: 0, // TODO: Implement when reports table is ready
      star_distribution
    };

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, profile_picture, created_at')
      .eq('id', targetUserId)
      .single();

    if (userError) {
      console.error('Failed to get user details:', userError);
    }

    res.json({
      success: true,
      data: {
        user: userData,
        analytics: analyticsData
      }
    });

  } catch (error) {
    console.error('Get user rating analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rating analytics'
    });
  }
});

// Get user rating analytics
router.get('/ratings/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    // Users can only view their own analytics unless they're admins
    if (targetUserId !== req.user.id) {
      // Get current user's email to check if admin
      const { data: currentUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', req.user.id)
        .single();

      if (!currentUser || (currentUser.email !== "admin@gmail.com" && currentUser.email !== "ktkarumbaiah@gmail.com")) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own analytics'
        });
      }
    }

    // Get rating analytics directly from ratings table
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select('stars, review, created_at, from_user_id')
      .eq('to_user_id', targetUserId);

    if (ratingsError) {
      console.error('Failed to get user rating analytics:', ratingsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to get rating analytics'
      });
    }

    // Calculate analytics from ratings data
    const totalReviews = ratingsData?.length || 0;
    const averageRating = totalReviews > 0 
      ? ratingsData.reduce((sum, r) => sum + r.stars, 0) / totalReviews 
      : 0;

    // Calculate star distribution
    const starDistribution = {
      '5_star': 0,
      '4_star': 0,
      '3_star': 0,
      '2_star': 0,
      '1_star': 0
    };

    ratingsData?.forEach(rating => {
      const key = `${rating.stars}_star`;
      if (starDistribution.hasOwnProperty(key)) {
        starDistribution[key]++;
      }
    });

    // Get completed rides count
    const { count: completedRides, error: ridesError } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', targetUserId)
      .eq('ride_completed', true);

    const analyticsData = {
      total_rides_completed: completedRides || 0,
      average_rating: averageRating.toFixed(1),
      total_reviews_received: totalReviews,
      total_reports_received: 0, // TODO: Implement when reports table is ready
      star_distribution
    };

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, profile_picture, created_at')
      .eq('id', targetUserId)
      .single();

    if (userError) {
      console.error('Failed to get user details:', userError);
    }

    res.json({
      success: true,
      data: {
        user: userData,
        analytics: analyticsData
      }
    });

  } catch (error) {
    console.error('Get user rating analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rating analytics'
    });
  }
});

// Get current user's recent reviews
router.get('/reviews', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:users(id, name, profile_picture),
        ride:announcements(id, start_location_name, destination_name, date, time)
      `)
      .eq('reviewee_id', targetUserId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Failed to get user reviews:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get reviews'
      });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewee_id', targetUserId);

    if (countError) {
      console.error('Failed to get reviews count:', countError);
    }

    res.json({
      success: true,
      data: {
        reviews: data || [],
        pagination: {
          total: count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (offset + limit) < (count || 0)
        }
      }
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews'
    });
  }
});

// Get user's recent reviews
router.get('/reviews/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { limit = 10, offset = 0 } = req.query;

    // Users can only view their own reviews unless they're admins
    if (targetUserId !== req.user.id) {
      // Get current user's email to check if admin
      const { data: currentUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', req.user.id)
        .single();

      if (!currentUser || (currentUser.email !== "admin@gmail.com" && currentUser.email !== "ktkarumbaiah@gmail.com")) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own reviews'
        });
      }
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:users(id, name, profile_picture),
        ride:announcements(id, start_location_name, destination_name, date, time)
      `)
      .eq('reviewee_id', targetUserId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('Failed to get user reviews:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get reviews'
      });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewee_id', targetUserId);

    if (countError) {
      console.error('Failed to get reviews count:', countError);
    }

    res.json({
      success: true,
      data: {
        reviews: data || [],
        pagination: {
          total: count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (offset + limit) < (count || 0)
        }
      }
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews'
    });
  }
});

// Get current user's completed rides
router.get('/completed-rides', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    // Get rides where user was creator
    const { data: createdRides, error: createdError } = await supabase
      .from('announcements')
      .select(`
        *,
        created_by:users(id, name, profile_picture)
      `)
      .eq('created_by', targetUserId)
      .eq('ride_completed', true)
      .order('completed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (createdError) {
      console.error('Failed to get created rides:', createdError);
    }

    // Get rides where user was participant
    const { data: participatedRides, error: participatedError } = await supabase
      .from('announcement_participants')
      .select(`
        *,
        announcement:announcements(id, start_location_name, destination_name, date, time, price, ride_completed, completed_at, created_by),
        announcement:announcement:created_by:users(id, name, profile_picture)
      `)
      .eq('user_id', targetUserId)
      .eq('status', 'accepted')
      .in('announcement.ride_completed', [true]);

    if (participatedError) {
      console.error('Failed to get participated rides:', participatedError);
    }

    // Combine and sort rides
    const allRides = [
      ...(createdRides || []).map(ride => ({
        ...ride,
        role: 'creator',
        completed_at: ride.completed_at
      })),
      ...(participatedRides || []).map(participation => ({
        ...participation.announcement,
        role: 'participant',
        completed_at: participation.announcement.completed_at
      }))
    ].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
     .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Get total count
    const totalCreated = createdRides?.length || 0;
    const totalParticipated = participatedRides?.length || 0;
    const totalCount = totalCreated + totalParticipated;

    res.json({
      success: true,
      data: {
        rides: allRides,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (offset + limit) < totalCount
        },
        summary: {
          created: totalCreated,
          participated: totalParticipated
        }
      }
    });

  } catch (error) {
    console.error('Get completed rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed rides'
    });
  }
});

// Get user's completed rides
router.get('/completed-rides/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { limit = 10, offset = 0 } = req.query;

    // Users can only view their own completed rides unless they're admins
    if (targetUserId !== req.user.id) {
      // Get current user's email to check if admin
      const { data: currentUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', req.user.id)
        .single();

      if (!currentUser || (currentUser.email !== "admin@gmail.com" && currentUser.email !== "ktkarumbaiah@gmail.com")) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own completed rides'
        });
      }
    }

    // Get rides where user was creator
    const { data: createdRides, error: createdError } = await supabase
      .from('announcements')
      .select(`
        *,
        created_by:users(id, name, profile_picture)
      `)
      .eq('created_by', targetUserId)
      .eq('ride_completed', true)
      .order('completed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (createdError) {
      console.error('Failed to get created rides:', createdError);
    }

    // Get rides where user was participant
    const { data: participatedRides, error: participatedError } = await supabase
      .from('announcement_participants')
      .select(`
        *,
        announcement:announcements(id, start_location_name, destination_name, date, time, price, ride_completed, completed_at, created_by),
        announcement:announcement:created_by:users(id, name, profile_picture)
      `)
      .eq('user_id', targetUserId)
      .eq('status', 'accepted')
      .in('announcement.ride_completed', [true]);

    if (participatedError) {
      console.error('Failed to get participated rides:', participatedError);
    }

    // Combine and sort rides
    const allRides = [
      ...(createdRides || []).map(ride => ({
        ...ride,
        role: 'creator',
        completed_at: ride.completed_at
      })),
      ...(participatedRides || []).map(participation => ({
        ...participation.announcement,
        role: 'participant',
        completed_at: participation.announcement.completed_at
      }))
    ].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
     .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Get total count
    const totalCreated = createdRides?.length || 0;
    const totalParticipated = participatedRides?.length || 0;
    const totalCount = totalCreated + totalParticipated;

    res.json({
      success: true,
      data: {
        rides: allRides,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (offset + limit) < totalCount
        },
        summary: {
          created: totalCreated,
          participated: totalParticipated
        }
      }
    });

  } catch (error) {
    console.error('Get completed rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed rides'
    });
  }
});

// Get platform-wide analytics (admin only)
router.get('/platform', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.id)
      .single();

    if (!currentUser || (currentUser.email !== "admin@gmail.com" && currentUser.email !== "ktkarumbaiah@gmail.com")) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get platform statistics
    const [
      { data: totalUsers, error: usersError },
      { data: totalRides, error: ridesError },
      { data: totalReviews, error: reviewsError },
      { data: totalReports, error: reportsError },
      { data: completedRides, error: completedError }
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('announcements').select('id', { count: 'exact', head: true }),
      supabase.from('refuse').select('id', { count: 'exact', head: true }),
      supabase.from('refuse').select('id', { count: 'exact', head: true }).eq('is_report', true),
      supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('ride_completed', true)
    ]);

    // Get rating distribution
    const { data: ratingDistribution, error: ratingError } = await supabase
      .from('refuse')
      .select('stars')
      .eq('is_report', false)
      .order('stars');

    // Calculate rating stats
    let ratingStats = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    if (ratingDistribution && !ratingError) {
      ratingDistribution.forEach(review => {
        ratingStats[review.stars] = (ratingStats[review.stars] || 0) + 1;
      });
    }

    // Get report distribution
    const { data: reportDistribution, error: reportDistError } = await supabase
      .from('refuse')
      .select('report_category')
      .eq('is_report', true)
      .order('report_category');

    let reportStats = {};
    if (reportDistribution && !reportDistError) {
      reportDistribution.forEach(report => {
        reportStats[report.report_category] = (reportStats[report.report_category] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        overview: {
          total_users: totalUsers || 0,
          total_rides: totalRides || 0,
          completed_rides: completedRides || 0,
          total_reviews: totalReviews || 0,
          total_reports: totalReports || 0,
          completion_rate: totalRides > 0 ? ((completedRides || 0) / totalRides * 100).toFixed(2) : 0
        },
        rating_distribution: ratingStats,
        report_distribution: reportStats
      }
    });

  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform analytics'
    });
  }
});

module.exports = router;
