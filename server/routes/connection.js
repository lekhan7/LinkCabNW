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

// Get connection requests for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('connection_requests')
      .select(`
        *,
        from_user:users(id, name, email, phone_number),
        to_user:users(id, name, email, phone_number),
        announcement:announcements(id, start_location_name, destination_name, price, date, time)
      `)
      .or(`from_user_id.eq.${req.user.id},to_user_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections'
    });
  }
});

// Create connection request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { to_user_id, announcement_id, message, payment_reference } = req.body;

    if (!to_user_id || !announcement_id) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: to_user_id, announcement_id'
      });
    }

    if (to_user_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a connection request to yourself'
      });
    }

    // Check if connection request already exists
    const { data: existingRequest } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('from_user_id', req.user.id)
      .eq('to_user_id', to_user_id)
      .eq('announcement_id', announcement_id)
      .in('status', 'pending')
      .single();

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Connection request already exists'
      });
    }

    const connectionData = {
      from_user_id: req.user.id,
      to_user_id,
      announcement_id,
      message: message || '',
      payment_reference: payment_reference || null,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('connection_requests')
      .insert(connectionData)
      .select(`
        *,
        from_user:users(id, name, email, phone_number),
        to_user:users(id, name, email, phone_number),
        announcement:announcements(id, start_location_name, destination_name, price, date, time)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      data: data
    });
  } catch (error) {
    console.error('Create connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create connection request'
    });
  }
});

// Update connection request status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, payment_status, payment_reference } = req.body;
    const connectionId = req.params.id;

    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, accepted, or rejected'
      });
    }

    // Check if connection request exists and user has permission
    const { data: existingConnection } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!existingConnection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Check permissions: only recipient can update status
    if (existingConnection.to_user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this connection request'
      });
    }

    const updateData = { status };
    if (payment_status) {
      updateData.payment_status = payment_status;
    }
    if (payment_reference) {
      updateData.payment_reference = payment_reference;
    }

    const { data, error } = await supabase
      .from('connection_requests')
      .update(updateData)
      .eq('id', connectionId)
      .select(`
        *,
        from_user:users(id, name, email, phone_number),
        to_user:users(id, name, email, phone_number),
        announcement:announcements(id, start_location_name, destination_name, price, date, time)
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Connection request updated successfully',
      data: data
    });
  } catch (error) {
    console.error('Update connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update connection request'
    });
  }
});

// Delete connection request
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const connectionId = req.params.id;

    // Check if connection request exists and user has permission
    const { data: existingConnection } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!existingConnection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Only sender can delete their own request
    if (existingConnection.from_user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this connection request'
      });
    }

    const { error } = await supabase
      .from('connection_requests')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Connection request deleted successfully'
    });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete connection request'
    });
  }
});

module.exports = router;
