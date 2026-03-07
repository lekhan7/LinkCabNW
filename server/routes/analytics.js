const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { auth } = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics routes are working!'
  });
});

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    // Get user counts
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: verifiedUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('verified', true);

    const { count: onlineUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_online', true);

    // Get announcement counts
    const { count: totalAnnouncements } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true });

    const { count: activeAnnouncements } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('ride_completed', false);

    // Get ride counts
    const { count: totalRides } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true });

    const { count: completedRides } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get payment counts
    const { count: totalPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    const { count: completedPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get rating counts
    const { count: totalRatings } = await supabase
      .from('ratings')
      .select('*', { count: 'exact', head: true });

    // Get connection counts
    const { count: totalConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true });

    const { count: pendingConnections } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { count: recentUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    const { count: recentAnnouncements } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers || 0,
          verified: verifiedUsers || 0,
          online: onlineUsers || 0,
          recent: recentUsers || 0
        },
        announcements: {
          total: totalAnnouncements || 0,
          active: activeAnnouncements || 0,
          recent: recentAnnouncements || 0
        },
        rides: {
          total: totalRides || 0,
          completed: completedRides || 0
        },
        payments: {
          total: totalPayments || 0,
          completed: completedPayments || 0
        },
        ratings: {
          total: totalRatings || 0
        },
        connections: {
          total: totalConnections || 0,
          pending: pendingConnections || 0
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

// Get user analytics
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('created_at, verified, is_online, role')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group users by creation date
    const userStats = users.reduce((acc, user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, verified: 0, online: 0 };
      }
      acc[date].total += 1;
      if (user.verified) acc[date].verified += 1;
      if (user.is_online) acc[date].online += 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics'
    });
  }
});

// Get announcement analytics
router.get('/announcements', async (req, res) => {
  try {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('created_at, ride_completed, passenger_capacity, price')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate statistics
    const totalAnnouncements = announcements.length;
    const completedAnnouncements = announcements.filter(a => a.ride_completed).length;
    const totalCapacity = announcements.reduce((sum, a) => sum + a.passenger_capacity, 0);
    const avgPrice = announcements.length > 0 
      ? announcements.reduce((sum, a) => sum + parseFloat(a.price), 0) / announcements.length 
      : 0;

    res.json({
      success: true,
      data: {
        total: totalAnnouncements,
        completed: completedAnnouncements,
        completionRate: totalAnnouncements > 0 ? (completedAnnouncements / totalAnnouncements * 100).toFixed(2) : 0,
        totalCapacity,
        averagePrice: avgPrice.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get announcement analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement analytics'
    });
  }
});

// Get payment analytics
router.get('/payments', async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('created_at, amount, status, payment_method')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate statistics
    const totalPayments = payments.length;
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Group by payment method
    const paymentMethods = payments.reduce((acc, payment) => {
      if (!acc[payment.payment_method]) {
        acc[payment.payment_method] = { count: 0, amount: 0 };
      }
      acc[payment.payment_method].count += 1;
      acc[payment.payment_method].amount += parseFloat(payment.amount);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: totalPayments,
        completed: completedPayments,
        totalRevenue,
        completionRate: totalPayments > 0 ? (completedPayments / totalPayments * 100).toFixed(2) : 0,
        paymentMethods
      }
    });
  } catch (error) {
    console.error('Get payment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment analytics'
    });
  }
});

// Get user's personal analytics
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user's announcements created
    const { count: announcementsCreated } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get user's rides joined
    const { count: tripsJoined } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('passenger_id', userId);

    // Get user's rides completed
    const { count: tripsCompleted } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('passenger_id', userId)
      .eq('status', 'completed');

    // Get total amount spent
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const totalAmountSpent = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const totalPaymentsMade = payments?.length || 0;

    // Get user's preferred places
    const { data: userProfile } = await supabase
      .from('users')
      .select('preferred_places')
      .eq('id', userId)
      .single();

    const preferredPlaces = userProfile?.preferred_places || [];

    // Get recent destination matches
    const { data: recentMatches } = await supabase
      .from('announcements')
      .select(`
        destination_location,
        created_at,
        users!announcements_user_id_fkey (name)
      `)
      .in('destination_location->name', preferredPlaces)
      .eq('ride_completed', false)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentDestinationMatches = recentMatches?.map(match => ({
      destination: match.destination_location?.name || 'Unknown',
      date: match.created_at,
      announcerName: match.users?.name || 'Unknown'
    })) || [];

    // Get recent activity
    const { data: recentRides } = await supabase
      .from('rides')
      .select(`
        source_location,
        destination_location,
        date,
        time
      `)
      .eq('passenger_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: recentAnnouncements } = await supabase
      .from('announcements')
      .select(`
        destination_location,
        date,
        time
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    res.json({
      success: true,
      analytics: {
        announcementsCreated: announcementsCreated || 0,
        tripsJoined: tripsJoined || 0,
        tripsCompleted: tripsCompleted || 0,
        totalAmountSpent: totalAmountSpent.toFixed(2),
        totalPaymentsMade,
        preferredPlaces,
        recentDestinationMatches,
        recentActivity: {
          rides: recentRides || [],
          announcements: recentAnnouncements || []
        }
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics'
    });
  }
});

// Get user's reviews analytics
router.get('/reviews', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user's reviews
    const { data: reviews, error } = await supabase
      .from('ratings')
      .select(`
        rating,
        feedback,
        created_at,
        reviewer:users!ratings_reviewer_id_fkey (name)
      `)
      .eq('rated_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate average rating
    const totalReviews = reviews?.length || 0;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    // Format reviews data
    const formattedReviews = reviews?.map(review => ({
      rating: review.rating,
      feedback: review.feedback,
      createdAt: review.created_at,
      reviewerName: review.reviewer?.name || 'Anonymous'
    })) || [];

    res.json({
      success: true,
      averageRating: averageRating.toFixed(1),
      totalReviews,
      reviews: formattedReviews
    });
  } catch (error) {
    console.error('Get reviews analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews analytics'
    });
  }
});

module.exports = router;
