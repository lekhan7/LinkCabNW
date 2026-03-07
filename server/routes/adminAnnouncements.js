const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // The auth middleware already attached the user from public.users
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user is admin
    if (req.user.email !== "admin@gmail.com" && req.user.email !== "ktkarumbaiah@gmail.com") {
      console.log(`Access denied: user ${req.user.email} is not an admin`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log(`✅ Admin access granted for user ${req.user.id} (${req.user.email})`);
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify admin access'
    });
  }
};

// Get all announcements for admin
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const { 
      search = '', 
      status = '',
      page = 1, 
      limit = 50 
    } = req.query;

    let query = supabase
      .from('announcements')
      .select(`
        *,
        creator:users!announcements_created_by_fkey(name, phone_number, email),
        participants:announcement_participants(count)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`start_location_name.ilike.%${search}%,destination_name.ilike.%${search}%,creator.name.ilike.%${search}%`);
    }
    
    if (status) {
      if (status === 'completed') {
        query = query.eq('ride_completed', true);
      } else if (status === 'active') {
        query = query.eq('ride_completed', false);
      }
    }

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch announcements:', error);
      // Fallback to basic query
      const fallbackQuery = supabase
        .from('announcements')
        .select('*', { count: 'exact' });

      if (search) {
        fallbackQuery = fallbackQuery.or(`start_location_name.ilike.%${search}%,destination_name.ilike.%${search}%`);
      }
      
      if (status) {
        if (status === 'completed') {
          fallbackQuery = fallbackQuery.eq('ride_completed', true);
        } else if (status === 'active') {
          fallbackQuery = fallbackQuery.eq('ride_completed', false);
        }
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
    console.error('Get admin announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements'
    });
  }
});

// Delete announcement (admin only)
router.delete('/:announcementId', auth, requireAdmin, async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    // First, get announcement details and participants for notifications
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select(`
        *,
        participants:announcement_participants(
          user_id,
          status,
          user:users(name, email)
        )
      `)
      .eq('id', announcementId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch announcement details:', fetchError);
      throw fetchError;
    }

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    console.log(`Deleting announcement: ${announcement.start_location_name} → ${announcement.destination_name}`);

    // 1. Delete participants
    const { error: participantsError } = await supabase
      .from('announcement_participants')
      .delete()
      .eq('announcement_id', announcementId);

    if (participantsError) {
      console.error('Failed to delete participants:', participantsError);
    } else {
      console.log('Successfully deleted announcement participants');
    }

    // 2. Delete completion status records
    const { error: completionError } = await supabase
      .from('announcement_completion_status')
      .delete()
      .eq('announcement_id', announcementId);

    if (completionError) {
      console.error('Failed to delete completion status:', completionError);
    } else {
      console.log('Successfully deleted completion status records');
    }

    // 3. Delete favorite routes (favorites)
    const { error: favoritesError } = await supabase
      .from('favorite_routes')
      .delete()
      .eq('announcement_id', announcementId);

    if (favoritesError) {
      console.error('Failed to delete favorites:', favoritesError);
    } else {
      console.log('Successfully deleted favorite routes');
    }

    // 4. Create deletion notifications for all participants
    const activeParticipants = announcement.participants?.filter(p => p.status === 'accepted') || [];
    console.log(`Creating notifications for ${activeParticipants.length} participants`);

    if (activeParticipants.length > 0) {
      const notifications = activeParticipants.map(participant => ({
        recipient_id: participant.user_id,
        sender_id: req.user.id,
        type: 'announcement_deleted',
        title: '🚨 Announcement Deleted',
        message: `The announcement "${announcement.start_location_name} → ${announcement.destination_name}" has been deleted by the administrator.`,
        announcement_id: announcementId,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Failed to create deletion notifications:', notificationError);
      } else {
        console.log(`Successfully created ${notifications.length} deletion notifications`);
        
        // Emit real-time notifications via Socket.IO
        const io = req.app.get('io');
        if (io) {
          activeParticipants.forEach(participant => {
            io.to(`user-${participant.user_id}`).emit('notification', {
              type: 'announcement_deleted',
              title: '🚨 Announcement Deleted',
              message: `The announcement "${announcement.start_location_name} → ${announcement.destination_name}" has been deleted by the administrator.`,
              announcementId: announcementId
            });
          });
          console.log('Real-time notifications sent via Socket.IO');
        }
      }
    }

    // 5. Delete old notifications related to this announcement
    const { error: oldNotificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('announcement_id', announcementId);

    if (oldNotificationsError) {
      console.error('Failed to delete old notifications:', oldNotificationsError);
    } else {
      console.log('Successfully deleted related notifications');
    }

    // 6. Delete the announcement itself
    const { error: deleteError } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (deleteError) {
      console.error('Failed to delete announcement:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted announcement ${announcementId} and all related data`);

    res.json({
      success: true,
      message: 'Announcement and all related data deleted successfully',
      notificationsSent: activeParticipants.length
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement'
    });
  }
});

// Create announcement (admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const {
      start_location_name,
      destination_name,
      start_location,
      destination,
      date,
      time,
      price,
      passenger_capacity,
      vehicle_type,
      comfort_level,
      seat_preference,
      route_type,
      smoking_preference,
      alcohol_preference,
      music_preference,
      conversation_preference,
      pets_preference,
      ac_preference,
      luggage_preference,
      gender_preference,
      notes
    } = req.body;

    // Validate required fields
    if (!start_location_name || !destination_name || !date || !time || !price || !passenger_capacity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: start_location_name, destination_name, date, time, price, passenger_capacity'
      });
    }

    // Parse location coordinates if provided
    let startCoords = start_location;
    let endCoords = destination;

    if (typeof start_location === 'string') {
      try {
        startCoords = JSON.parse(start_location);
      } catch (e) {
        startCoords = null;
      }
    }

    if (typeof destination === 'string') {
      try {
        endCoords = JSON.parse(destination);
      } catch (e) {
        endCoords = null;
      }
    }

    const announcementData = {
      created_by: req.user.id,
      start_location_name,
      destination_name,
      start_location: startCoords,
      destination: endCoords,
      date,
      time,
      price: parseFloat(price),
      passenger_capacity: parseInt(passenger_capacity),
      vehicle_type: vehicle_type || 'personal_car',
      comfort_level: comfort_level || 'comfortable',
      seat_preference: seat_preference || 'partial-sharing',
      route_type: route_type || 'daily-route',
      smoking_preference: smoking_preference || '',
      alcohol_preference: alcohol_preference || '',
      music_preference: music_preference || '',
      conversation_preference: conversation_preference || '',
      pets_preference: pets_preference || '',
      ac_preference: ac_preference || '',
      luggage_preference: luggage_preference || '',
      gender_preference: gender_preference || '',
      notes: notes || '',
      ride_completed: false
    };

    const { data, error } = await supabase
      .from('announcements')
      .insert(announcementData)
      .select(`
        *,
        creator:users!announcements_created_by_fkey(name, email, phone_number)
      `)
      .single();

    if (error) {
      console.error('Failed to create announcement:', error);
      throw error;
    }

    console.log('Admin created announcement:', data.id);

    res.json({
      success: true,
      message: 'Announcement created successfully',
      data
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
});

// Update announcement status (admin only)
router.put('/:announcementId/status', auth, requireAdmin, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { ride_completed } = req.body;

    if (typeof ride_completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'ride_completed must be a boolean'
      });
    }

    const { data, error } = await supabase
      .from('announcements')
      .update({ 
        ride_completed,
        completed_at: ride_completed ? new Date().toISOString() : null
      })
      .eq('id', announcementId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update announcement:', error);
      throw error;
    }

    res.json({
      success: true,
      message: `Announcement ${ride_completed ? 'completed' : 'reopened'} successfully`,
      data
    });

  } catch (error) {
    console.error('Update announcement status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement status'
    });
  }
});

module.exports = router;
