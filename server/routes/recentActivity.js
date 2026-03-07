const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get recent activities for admin dashboard
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent user registrations
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, name, email, phone_number, created_at, verified, is_online')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get recent announcements
    const { data: recentAnnouncements } = await supabase
      .from('announcements')
      .select(`
        id, start_location_name, destination_name, price, date, time, 
        created_at, ride_completed, created_by
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get recent rides
    const { data: recentRides } = await supabase
      .from('rides')
      .select('id, source_name, destination_name, date, time, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get recent payments
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('id, amount, status, payment_method, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get recent connection requests
    const { data: recentConnections } = await supabase
      .from('connection_requests')
      .select('id, status, created_at, from_user_id, to_user_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get recent ratings
    const { data: recentRatings } = await supabase
      .from('ratings')
      .select('id, stars, review, created_at, from_user_id, to_user_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Combine all activities with type information
    const activities = [
      ...recentUsers.map(user => ({
        type: 'user_registration',
        id: user.id,
        description: `New user registered: ${user.name}`,
        user: user,
        timestamp: user.created_at
      })),
      ...recentAnnouncements.map(announcement => ({
        type: 'announcement_created',
        id: announcement.id,
        description: `New announcement: ${announcement.start_location_name} to ${announcement.destination_name}`,
        data: announcement,
        timestamp: announcement.created_at
      })),
      ...recentRides.map(ride => ({
        type: 'ride_created',
        id: ride.id,
        description: `New ride: ${ride.source_name} to ${ride.destination_name}`,
        data: ride,
        timestamp: ride.created_at
      })),
      ...recentPayments.map(payment => ({
        type: 'payment_created',
        id: payment.id,
        description: `Payment of ${payment.amount} via ${payment.payment_method}`,
        data: payment,
        timestamp: payment.created_at
      })),
      ...recentConnections.map(connection => ({
        type: 'connection_request',
        id: connection.id,
        description: `Connection request: ${connection.status}`,
        data: connection,
        timestamp: connection.created_at
      })),
      ...recentRatings.map(rating => ({
        type: 'rating_given',
        id: rating.id,
        description: `Rating: ${rating.stars} stars`,
        data: rating,
        timestamp: rating.created_at
      }))
    ];

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Take the most recent activities
    const recentActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: recentActivities
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
});

// Get recent activities for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's recent announcements
    const { data: userAnnouncements } = await supabase
      .from('announcements')
      .select('id, start_location_name, destination_name, price, date, time, created_at, ride_completed')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get user's recent rides
    const { data: userRides } = await supabase
      .from('rides')
      .select('id, source_name, destination_name, date, time, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get user's recent payments
    const { data: userPayments } = await supabase
      .from('payments')
      .select('id, amount, status, payment_method, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get user's recent ratings
    const { data: userRatings } = await supabase
      .from('ratings')
      .select('id, stars, review, created_at, to_user_id')
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get user's recent connection requests
    const { data: userConnections } = await supabase
      .from('connection_requests')
      .select('id, status, message, created_at, to_user_id, from_user_id')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Combine user activities
    const userActivities = [
      ...userAnnouncements.map(announcement => ({
        type: 'announcement_created',
        id: announcement.id,
        description: `Created announcement: ${announcement.start_location_name} to ${announcement.destination_name}`,
        data: announcement,
        timestamp: announcement.created_at
      })),
      ...userRides.map(ride => ({
        type: 'ride_created',
        id: ride.id,
        description: `Created ride: ${ride.source_name} to ${ride.destination_name}`,
        data: ride,
        timestamp: ride.created_at
      })),
      ...userPayments.map(payment => ({
        type: 'payment_created',
        id: payment.id,
        description: `Payment of ${payment.amount} via ${payment.payment_method}`,
        data: payment,
        timestamp: payment.created_at
      })),
      ...userRatings.map(rating => ({
        type: 'rating_given',
        id: rating.id,
        description: `Rated user: ${rating.stars} stars`,
        data: rating,
        timestamp: rating.created_at
      })),
      ...userConnections.map(connection => ({
        type: 'connection_request',
        id: connection.id,
        description: `Connection request: ${connection.status}`,
        data: connection,
        timestamp: connection.created_at
      }))
    ];

    // Sort by timestamp
    userActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Take the most recent activities
    const recentUserActivities = userActivities.slice(0, limit);

    res.json({
      success: true,
      data: recentUserActivities
    });
  } catch (error) {
    console.error('Get user recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user recent activities'
    });
  }
});

// Get activity statistics
router.get('/stats', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h'; // 24h, 7d, 30d
    
    let timeFilter;
    const now = new Date();
    
    switch (timeRange) {
      case '24h':
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Count activities in time range
    const [
      { count: userRegistrations },
      { count: announcementsCreated },
      { count: ridesCreated },
      { count: paymentsMade },
      { count: ratingsGiven },
      { count: connectionRequests }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', timeFilter.toISOString()),
      supabase.from('announcements').select('*', { count: 'exact', head: true }).gte('created_at', timeFilter.toISOString()),
      supabase.from('rides').select('*', { count: 'exact', head: true }).gte('created_at', timeFilter.toISOString()),
      supabase.from('payments').select('*', { count: 'exact', head: true }).gte('created_at', timeFilter.toISOString()),
      supabase.from('ratings').select('*', { count: 'exact', head: true }).gte('created_at', timeFilter.toISOString()),
      supabase.from('connection_requests').select('*', { count: 'exact', head: true }).gte('created_at', timeFilter.toISOString())
    ]);

    res.json({
      success: true,
      data: {
        timeRange,
        userRegistrations: userRegistrations || 0,
        announcementsCreated: announcementsCreated || 0,
        ridesCreated: ridesCreated || 0,
        paymentsMade: paymentsMade || 0,
        ratingsGiven: ratingsGiven || 0,
        connectionRequests: connectionRequests || 0
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics'
    });
  }
});

module.exports = router;
