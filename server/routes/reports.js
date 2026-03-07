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

// Submit a report
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { 
      announcementId, 
      reportedUserId, 
      reason, 
      description
    } = req.body;

    if (!announcementId || !reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: announcementId, reportedUserId, reason'
      });
    }

    // First try the RPC function
    let { data: result, error: reportError } = await supabase
      .rpc('submit_report', { 
        ride_uuid: announcementId,
        reporter_uuid: req.user.id,
        reported_user_uuid: reportedUserId,
        report_reason: reason,
        report_description: description || ''
      });

    // If RPC function doesn't exist, use fallback logic
    if (reportError && reportError.message.includes('function "submit_report" does not exist')) {
      console.log('RPC function not found, using fallback logic...');
      
      // Check if report already exists
      const { data: existingReport } = await supabase
        .from('reports')
        .select('*')
        .eq('announcement_id', announcementId)
        .eq('reporter_id', req.user.id)
        .eq('reported_user_id', reportedUserId)
        .single();

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: 'You have already reported this user for this ride'
        });
      }

      // Insert the report directly into the correct reports table
      const { data: newReport, error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: req.user.id,
          reported_user_id: reportedUserId,
          announcement_id: announcementId,
          category: reason,
          description: description,
          severity: 'medium', // Default severity
          status: 'pending', // Default status
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to submit report:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Failed to submit report'
        });
      }

      result = { success: true, message: 'Report submitted successfully' };
      reportError = null;
    }

    if (reportError) {
      console.error('Failed to submit report:', reportError);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit report'
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to submit report'
      });
    }

    // Send real-time notification to admins
    if (io) {
      io.emit('new_report', {
        type: 'new_report',
        message: `A new report has been filed against a user. Reason: ${reason}`,
        announcement_id: announcementId,
        reporter_id: req.user.id,
        reported_user_id: reportedUserId
      });
    }

    // Create notification for the reported user
    try {
      const notificationResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/notifications/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`
        },
        body: JSON.stringify({
          reportedUserId: reportedUserId,
          reporterName: req.user.name || 'A user',
          reason: reason,
          announcementId: announcementId
        })
      });
      
      if (!notificationResponse.ok) {
        console.error('Failed to create report notification:', notificationResponse.statusText);
      }
    } catch (notifError) {
      console.error('Error creating report notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report'
    });
  }
});

// Get report reasons
router.get('/reasons', authenticateToken, async (req, res) => {
  try {
    const reasons = [
      { value: 'misbehavior', label: 'Misbehavior' },
      { value: 'no_show', label: 'No Show' },
      { value: 'unsafe_driving', label: 'Unsafe Driving' },
      { value: 'rude_behavior', label: 'Rude Behavior' },
      { value: 'other', label: 'Other' }
    ];

    res.json({
      success: true,
      data: reasons
    });

  } catch (error) {
    console.error('Get report reasons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report reasons'
    });
  }
});

// Get reports for admin (admin only)
router.get('/admin', authenticateToken, async (req, res) => {
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

    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users(id, name, email),
        reported_user:users(id, name, email),
        announcement:announcements(id, start_location_name, destination_name, date, time)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get reports:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get reports'
      });
    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports'
    });
  }
});

// Update report status (admin only)
router.put('/:reportId/status', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

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

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update report'
      });
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: data
    });

  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status'
    });
  }
});

// Get reports filed by current user
router.get('/my-reports', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reported_user:users(id, name, email),
        announcement:announcements(id, start_location_name, destination_name, date, time)
      `)
      .eq('reporter_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get user reports:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get your reports'
      });
    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get your reports'
    });
  }
});

// Get reports against current user
router.get('/reports-against-me', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users(id, name, email),
        announcement:announcements(id, start_location_name, destination_name, date, time)
      `)
      .eq('reported_user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get reports against user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get reports against you'
      });
    }

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get reports against user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports against you'
    });
  }
});

module.exports = router;
