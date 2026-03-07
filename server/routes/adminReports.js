const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user is admin
    if (req.user.email !== "admin@gmail.com" && req.user.email !== "ktkarumbaiah@gmail.com") {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify admin access'
    });
  }
};

// Get all reports for admin
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const { 
      search = '', 
      status = '',
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabase
      .from('ride_reports')
      .select(`
        *,
        reporter:users(id, name, email, phone_number),
        reported_user:users(id, name, email, phone_number),
        announcement:announcements(id, start_location_name, destination_name, date, time)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`reporter.name.ilike.%${search}%,reported_user.name.ilike.%${search}%,report_reason.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch reports:', error);
      // Fallback to basic query
      const fallbackQuery = supabase
        .from('ride_reports')
        .select('*', { count: 'exact' });

      if (search) {
        fallbackQuery = fallbackQuery.or(`report_reason.ilike.%${search}%`);
      }
      
      if (status) {
        fallbackQuery = fallbackQuery.eq('status', status);
      }

      const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (fallbackError) {
        throw fallbackError;
      }

      return res.json({
        success: true,
        data: fallbackData || [],
        pagination: {
          total: fallbackCount || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((fallbackCount || 0) / parseInt(limit))
        }
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// Update report status (admin only)
router.put('/:reportId/status', auth, requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, admin_notes } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const { data, error } = await supabase
      .from('ride_reports')
      .update({
        status,
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update report:', error);
      throw error;
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data
    });

  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status'
    });
  }
});

// Delete report (admin only)
router.delete('/:reportId', auth, requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;

    const { error } = await supabase
      .from('ride_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Failed to delete report:', error);
      throw error;
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report'
    });
  }
});

module.exports = router;
