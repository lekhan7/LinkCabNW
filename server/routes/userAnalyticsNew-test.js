const express = require('express');
const router = express.Router();

// Simple test dashboard endpoint that doesn't query the database
router.get('/dashboard', (req, res) => {
  console.log('📊 Simple dashboard endpoint called');
  
  try {
    const dashboardData = {
      totalRidesCreated: 0,
      totalRidesJoined: 0,
      totalReviewsReceived: 0,
      totalReportsReceived: 0
    };

    res.json({
      success: true,
      data: dashboardData,
      message: 'Simple dashboard data (no database queries)'
    });
  } catch (error) {
    console.error('Simple dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch simple dashboard data'
    });
  }
});

// Simple test reviews endpoint
router.get('/reviews-by-announcement', (req, res) => {
  console.log('📋 Simple reviews endpoint called');
  
  try {
    const reviewsData = {};

    res.json({
      success: true,
      data: reviewsData,
      message: 'Simple reviews data (no database queries)'
    });
  } catch (error) {
    console.error('Simple reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch simple reviews data'
    });
  }
});

module.exports = router;
