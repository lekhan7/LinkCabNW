const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get public announcements
router.get('/announcements', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        created_by:users(id, name, email)
      `)
      .eq('ride_completed', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get public announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements'
    });
  }
});

// Get public user stats
router.get('/stats', async (req, res) => {
  try {
    const [userCount, announcementCount] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('announcements').select('*', { count: 'exact', head: true })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: userCount.count || 0,
        totalAnnouncements: announcementCount.count || 0
      }
    });
  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

module.exports = router;
