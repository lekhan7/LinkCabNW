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

// Get all rides for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        ride_shares(
          id,
          user_id,
          status,
          user:users(id, name, email)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rides'
    });
  }
});

// Create a new ride
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      source_name,
      source_lat,
      source_lng,
      destination_name,
      destination_lat,
      destination_lng,
      date,
      time,
      travel_mode,
      estimated_cost,
      notes,
      is_shared
    } = req.body;

    if (!source_name || !source_lat || !source_lng || 
        !destination_name || !destination_lat || !destination_lng ||
        !date || !time || !travel_mode || !estimated_cost) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const rideData = {
      user_id: req.user.id,
      source_name,
      source_lat: parseFloat(source_lat),
      source_lng: parseFloat(source_lng),
      destination_name,
      destination_lat: parseFloat(destination_lat),
      destination_lng: parseFloat(destination_lng),
      date,
      time,
      travel_mode,
      estimated_cost: parseFloat(estimated_cost),
      notes: notes || '',
      is_shared: is_shared || false
    };

    const { data, error } = await supabase
      .from('rides')
      .insert(rideData)
      .select()
      .single();

    if (error) throw error;

    // Create favorite match notifications for users who have favorited this route
    try {
      const { error: notificationError } = await supabase
        .rpc('create_favorite_match_notification_for_ride', { 
          ride_uuid: data.id 
        });

      if (notificationError) {
        console.error('Failed to create favorite match notifications:', notificationError);
      } else {
        console.log(`🔔 Created favorite match notifications for new ride: ${data.id}`);
      }
    } catch (favError) {
      console.error('Error creating favorite match notifications:', favError);
    }

    // Also emit real-time notifications via Socket.IO for favorite route matches
    if (io) {
      try {
        // Find users with matching favorite routes for real-time notification
        const { data: matchingUsers } = await supabase
          .from('favorite_routes')
          .select(`
            user_id,
            users!favorite_routes_user_id_fkey (name, email)
          `)
          .or(`from_location.ilike.%${source_name}%,to_location.ilike.%${destination_name}%`)
          .or(`from_location.ilike.%${destination_name}%,to_location.ilike.%${source_name}%`)
          .neq('user_id', req.user.id);

        if (matchingUsers && matchingUsers.length > 0) {
          matchingUsers.forEach(match => {
            io.to(`user-${match.user_id}`).emit('favorite_route_match', {
              type: 'FAVORITE_ROUTE_MATCH',
              title: 'New ride on your favorite route!',
              message: `${req.user.name || 'A user'} has created a ride from ${source_name} to ${destination_name} on ${date} at ${time}`,
              ride_id: data.id,
              creator_name: req.user.name,
              route: {
                from: source_name,
                to: destination_name,
                date: date,
                time: time
              }
            });
          });
          console.log(`📡 Sent real-time notifications to ${matchingUsers.length} users for ride creation`);
        }
      } catch (socketError) {
        console.error('Error sending real-time notifications:', socketError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      data: data
    });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ride'
    });
  }
});

// Get ride by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        ride_shares(
          id,
          user_id,
          status,
          user:users(id, name, email)
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride'
    });
  }
});

// Update ride
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      source_name,
      source_lat,
      source_lng,
      destination_name,
      destination_lat,
      destination_lng,
      date,
      time,
      travel_mode,
      estimated_cost,
      actual_cost,
      notes,
      status
    } = req.body;

    // First check if ride exists and belongs to user
    const { data: existingRide, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const updateData = {};
    if (source_name !== undefined) updateData.source_name = source_name;
    if (source_lat !== undefined) updateData.source_lat = parseFloat(source_lat);
    if (source_lng !== undefined) updateData.source_lng = parseFloat(source_lng);
    if (destination_name !== undefined) updateData.destination_name = destination_name;
    if (destination_lat !== undefined) updateData.destination_lat = parseFloat(destination_lat);
    if (destination_lng !== undefined) updateData.destination_lng = parseFloat(destination_lng);
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (travel_mode !== undefined) updateData.travel_mode = travel_mode;
    if (estimated_cost !== undefined) updateData.estimated_cost = parseFloat(estimated_cost);
    if (actual_cost !== undefined) updateData.actual_cost = parseFloat(actual_cost);
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from('rides')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Ride updated successfully',
      data: data
    });
  } catch (error) {
    console.error('Update ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ride'
    });
  }
});

// Delete ride
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // First check if ride exists and belongs to user
    const { data: existingRide, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Don't allow deletion of completed rides
    if (existingRide.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed rides'
      });
    }

    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Ride deleted successfully'
    });
  } catch (error) {
    console.error('Delete ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ride'
    });
  }
});

module.exports = router;
