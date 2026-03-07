const express = require('express');
const router = express.Router();
const AnnouncementService = require('../services/announcementService');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
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

// Get all announcements (for authenticated users - all logged-in users can see all announcements)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 Fetching announcements for user: ${req.user.id}`);
    
    const filters = { rideCompleted: false };
    
    if (req.query.date) {
      filters.date = req.query.date;
    }
    if (req.query.dateFrom) {
      filters.dateFrom = req.query.dateFrom;
    }
    if (req.query.dateTo) {
      filters.dateTo = req.query.dateTo;
    }
    if (req.query.vehicleType) {
      filters.vehicleType = req.query.vehicleType;
    }
    if (req.query.minPrice) {
      filters.minPrice = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      filters.maxPrice = parseFloat(req.query.maxPrice);
    }

    console.log('📊 Filters applied:', filters);

    const announcements = await AnnouncementService.findAll(filters);
    console.log(`✅ Found ${announcements?.length || 0} announcements`);

    res.json({
      success: true,
      data: announcements,
      message: 'All active announcements retrieved successfully'
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
});

// Get all announcements without authentication (public endpoint)
router.get('/all', async (req, res) => {
  try {
    const filters = { rideCompleted: false };
    
    if (req.query.date) {
      filters.date = req.query.date;
    }
    if (req.query.dateFrom) {
      filters.dateFrom = req.query.dateFrom;
    }
    if (req.query.dateTo) {
      filters.dateTo = req.query.dateTo;
    }
    if (req.query.vehicleType) {
      filters.vehicleType = req.query.vehicleType;
    }
    if (req.query.minPrice) {
      filters.minPrice = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      filters.maxPrice = parseFloat(req.query.maxPrice);
    }

    const announcements = await AnnouncementService.findAll(filters);

    res.json({
      success: true,
      data: announcements,
      message: 'All announcements retrieved successfully'
    });
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements'
    });
  }
});

// Get user's own announcements
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const filters = { rideCompleted: false, createdBy: req.user.id };
    
    if (req.query.date) {
      filters.date = req.query.date;
    }
    if (req.query.dateFrom) {
      filters.dateFrom = req.query.dateFrom;
    }
    if (req.query.dateTo) {
      filters.dateTo = req.query.dateTo;
    }
    if (req.query.vehicleType) {
      filters.vehicleType = req.query.vehicleType;
    }
    if (req.query.minPrice) {
      filters.minPrice = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      filters.maxPrice = parseFloat(req.query.maxPrice);
    }

    const announcements = await AnnouncementService.findAll(filters);

    res.json({
      success: true,
      data: announcements,
      message: 'Your announcements retrieved successfully'
    });
  } catch (error) {
    console.error('Get my announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your announcements'
    });
  }
});

// Get rides user is participating in (Going Rides)
router.get('/going', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 Fetching going rides for user: ${req.user.id}`);
    
    const filters = { rideCompleted: false };
    
    if (req.query.date) {
      filters.date = req.query.date;
    }
    if (req.query.dateFrom) {
      filters.dateFrom = req.query.dateFrom;
    }
    if (req.query.dateTo) {
      filters.dateTo = req.query.dateTo;
    }
    if (req.query.vehicleType) {
      filters.vehicleType = req.query.vehicleType;
    }
    if (req.query.minPrice) {
      filters.minPrice = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      filters.maxPrice = parseFloat(req.query.maxPrice);
    }

    // Get announcements where user is a participant
    const { data: participants, error: participantsError } = await supabase
      .from('announcement_participants')
      .select(`
        announcement_id,
        status,
        joined_at,
        announcement:announcements(
          id,
          start_location_name,
          destination_name,
          date,
          time,
          price,
          passenger_capacity,
          vehicle_type,
          created_by,
          created_by:users(id, name, email),
          ride_completed
        )
      `)
      .eq('user_id', req.user.id)
      .eq('status', 'accepted')
      .order('joined_at', { ascending: false });

    console.log('📊 Query result:', { participants, participantsError });

    if (participantsError) {
      console.error('Get going rides error:', participantsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch your rides',
        error: participantsError.message
      });
    }

    // Transform the data
    const goingRides = participants.map(participant => ({
      ...participant.announcement,
      my_participant_status: participant.status,
      joined_at: participant.joined_at
    }));

    console.log(`✅ Found ${goingRides.length} going rides for user ${req.user.id}`);

    res.json({
      success: true,
      data: goingRides,
      message: 'Your rides retrieved successfully'
    });
  } catch (error) {
    console.error('Get going rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your rides',
      error: error.message
    });
  }
});

// Get announcement by ID
router.get('/:id', async (req, res) => {
  try {
    const announcement = await AnnouncementService.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement'
    });
  }
});

// Create new announcement
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      start_location_name,
      start_location,
      destination_name,
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

    // Only check for the fields that are actually required
    if (!start_location_name || !destination_name || !date || !time || !price || !passenger_capacity) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: start_location_name, destination_name, date, time, price, passenger_capacity'
      });
    }

    const announcementData = {
      created_by: req.user.id,
      start_location_name,
      start_location: start_location || null,
      destination_name,
      destination: destination || null,
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
      notes: notes || ''
    };

    const newAnnouncement = await AnnouncementService.create(announcementData);

    // Create notifications for users who have favorited this route
    try {
      // Call the database function to create favorite match notifications
      const { error: notificationError } = await supabase
        .rpc('create_favorite_match_notification', { 
          announcement_uuid: newAnnouncement.id 
        });

      if (notificationError) {
        console.error('Failed to create favorite match notifications:', notificationError);
      } else {
        console.log(`🔔 Created favorite match notifications for new announcement: ${newAnnouncement.id}`);
      }

      // Also emit real-time notifications via Socket.IO
      if (io) {
        // Find users with matching favorite routes for real-time notification
        const { data: matchingUsers } = await supabase
          .from('favorite_routes')
          .select(`
            user_id,
            users!favorite_routes_user_id_fkey (name, email)
          `)
          .or(`from_location.ilike.%${announcementData.start_location_name}%,to_location.ilike.%${announcementData.destination_name}%`)
          .neq('user_id', req.user.id);

        if (matchingUsers && matchingUsers.length > 0) {
          matchingUsers.forEach(match => {
            io.to(`user-${match.user_id}`).emit('favorite_route_match', {
              type: 'FAVORITE_ROUTE_MATCH',
              title: 'New ride on your favorite route!',
              message: `${req.user.name || 'A user'} has created a ride from ${announcementData.start_location_name} to ${announcementData.destination_name} on ${date} at ${time}`,
              announcement_id: newAnnouncement.id,
              creator_name: req.user.name,
              route: {
                from: announcementData.start_location_name,
                to: announcementData.destination_name,
                date: date,
                time: time
              }
            });
          });
          console.log(`📡 Sent real-time notifications to ${matchingUsers.length} users`);
        }
      }
    } catch (favError) {
      console.error('Error creating favorite match notifications:', favError);
    }

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: newAnnouncement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
});

// Update announcement
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // First check if announcement exists and belongs to user
    const existingAnnouncement = await AnnouncementService.findById(req.params.id);

    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (existingAnnouncement.created_by.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own announcements'
      });
    }

    // Don't allow updates if ride is completed
    if (existingAnnouncement.ride_completed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed announcements'
      });
    }

    const updateData = {};
    const allowedFields = [
      'start_location_name', 'destination_name', 'date', 'time', 'price',
      'passenger_capacity', 'vehicle_type', 'comfort_level', 'seat_preference',
      'route_type', 'smoking_preference', 'alcohol_preference', 'music_preference',
      'conversation_preference', 'pets_preference', 'ac_preference',
      'luggage_preference', 'gender_preference', 'notes'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'start_location' || field === 'destination') {
          const location = req.body[field];
          updateData[field] = `POINT(${location.lng} ${location.lat})`;
        } else if (field === 'price') {
          updateData[field] = parseFloat(req.body[field]);
        } else if (field === 'passenger_capacity') {
          updateData[field] = parseInt(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const updatedAnnouncement = await AnnouncementService.updateById(req.params.id, updateData);

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement'
    });
  }
});

// Delete announcement
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`🗑️ Delete request for announcement ${req.params.id} by user ${req.user.id}`);
    
    // First check if announcement exists and belongs to user
    const existingAnnouncement = await AnnouncementService.findById(req.params.id);

    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    console.log('🔍 Ownership check:');
    console.log('  - Announcement created_by:', existingAnnouncement.created_by);
    console.log('  - Announcement created_by.id:', existingAnnouncement.created_by?.id);
    console.log('  - Request user.id:', req.user.id);
    console.log('  - Request user:', JSON.stringify(req.user, null, 2));
    console.log('  - Types:', typeof existingAnnouncement.created_by, typeof existingAnnouncement.created_by?.id, typeof req.user.id);

    // Check ownership - handle multiple possible formats
    let isOwner = false;
    
    // Try different ways to compare the IDs
    if (existingAnnouncement.created_by && req.user.id) {
      // Direct comparison
      if (existingAnnouncement.created_by === req.user.id) {
        isOwner = true;
      }
      // Compare with user.id field if created_by is an object
      else if (existingAnnouncement.created_by.id && existingAnnouncement.created_by.id === req.user.id) {
        isOwner = true;
      }
      // Compare with user.sub field (common in JWT)
      else if (req.user.sub && existingAnnouncement.created_by === req.user.sub) {
        isOwner = true;
      }
      else if (req.user.sub && existingAnnouncement.created_by.id && existingAnnouncement.created_by.id === req.user.sub) {
        isOwner = true;
      }
      // String conversion comparison (handles UUID vs string issues)
      else if (String(existingAnnouncement.created_by) === String(req.user.id)) {
        isOwner = true;
      }
      else if (existingAnnouncement.created_by.id && String(existingAnnouncement.created_by.id) === String(req.user.id)) {
        isOwner = true;
      }
    }
    
    console.log('  - Is owner?', isOwner);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own announcements'
      });
    }

    // Don't allow deletion if ride is completed
    if (existingAnnouncement.ride_completed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed announcements'
      });
    }

    // Check if there are any participants (co-passengers)
    const { data: participants, error: participantsError } = await supabase
      .from('announcement_participants')
      .select('id')
      .eq('announcement_id', req.params.id)
      .eq('status', 'accepted');

    if (participantsError) {
      console.error('Error checking participants:', participantsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check participants'
      });
    }

    // Don't allow deletion if there are accepted participants
    if (participants && participants.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete announcement with co-passengers. You can only delete announcements without any accepted participants.'
      });
    }

    console.log(`🗑️ User ${req.user.id} deleting announcement ${req.params.id} (no participants found)`);

    await AnnouncementService.deleteById(req.params.id);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement'
    });
  }
});

// Join announcement (with ₹1 join fee and notification)
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const announcement = await AnnouncementService.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is trying to join their own announcement
    const ownerId = announcement.created_by?.id;
    if (ownerId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot join your own announcement'
      });
    }

    // Check if user has already requested to join
    const { data: existingParticipant } = await supabase
      .from('announcement_participants')
      .select('*')
      .eq('announcement_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (existingParticipant) {
      // Allow re-request if previous request was rejected
      if (existingParticipant.status === 'rejected') {
        // Delete the rejected request and allow new request
        await supabase
          .from('announcement_participants')
          .delete()
          .eq('id', existingParticipant.id);
      } else {
        return res.status(400).json({
          success: false,
          message: 'You have already requested to join this announcement'
        });
      }
    }

    // Check available seats
    const availableSeats = await AnnouncementService.getAvailableSeats(req.params.id);
    if (availableSeats <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No available seats'
      });
    }

    // Add participant with 'requested' status
    const participant = await AnnouncementService.addParticipant(req.params.id, req.user.id);

    // Create notification for announcement creator with fallback
    let notificationResult;
    let notificationError;
    
    try {
      // Try the new database function first
      const result = await supabase
        .rpc('create_join_request_notification', {
          announcement_uuid: req.params.id,
          requester_uuid: req.user.id,
          participant_uuid: participant.id
        });
      
      if (result.error) {
        throw result.error;
      }
      
      notificationResult = result.data;
      console.log(`🔔 Enhanced notification created:`, notificationResult);
    } catch (err) {
      console.log('⚠️ Enhanced notification failed, using fallback:', err.message);
      
      // Fallback to direct insertion
      const { data: fallbackNotification, error: fallbackError } = await supabase
        .from('notifications')
        .insert({
          recipient_id: announcement.created_by?.id,
          sender_id: req.user.id,
          type: 'join_request',
          title: 'New Join Request',
          message: `${req.user.name || 'A user'} wants to join your ride from ${announcement.start_location_name || 'your location'} to ${announcement.destination_name || 'your destination'} on ${announcement.date || 'the scheduled date'}. Click to accept or reject.`,
          announcement_id: req.params.id,
          request_id: participant.id,
          status: 'pending'
        })
        .select()
        .single();
      
      notificationError = fallbackError;
      if (!fallbackError) {
        console.log(`🔔 Fallback notification created:`, fallbackNotification);
      }
    }

    // Emit real-time notification to announcement creator
    const recipientId = announcement.created_by?.id;
    if (recipientId && io && io.to) {
      io.to(`user-${recipientId}`).emit('notification', {
        type: 'join_request',
        title: 'New Join Request',
        message: `${req.user.name || 'A user'} wants to join your ride from ${announcement.start_location_name || 'your location'} to ${announcement.destination_name || 'your destination'} on ${announcement.date || 'the scheduled date'}. Click to accept or reject.`,
        data: {
        announcement_id: req.params.id,
        sender: {
          id: req.user.id,
          name: req.user.name
        },
        participant: participant
      }
    });
    }

    console.log(`📡 Real-time notification sent to user ${announcement.created_by?.name || 'Unknown'}`);

    res.status(201).json({
      success: true,
      message: `You have requested to join the ride from ${announcement.start_location_name} to ${announcement.destination_name}. ₹1 fee applied. Waiting for approval.`,
      data: participant,
      notification: notificationResult || null
    });
  } catch (error) {
    console.error('Join announcement error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      announcementId: req.params.id,
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to join announcement',
      error: error.message
    });
  }
});

// Respond to join request (unified accept/reject endpoint)
router.put('/:id/respond/:requestId', authenticateToken, async (req, res) => {
  try {
    const { action } = req.body;
    
    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "accept" or "reject"'
      });
    }

    const announcement = await AnnouncementService.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const ownerId = announcement.created_by?.id;
    if (ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only announcement creator can respond to join requests'
      });
    }

    // Get participant details
    const { data: participant, error: participantError } = await supabase
      .from('announcement_participants')
      .select('id, user_id, announcement_id, status, joined_at')
      .eq('id', req.params.requestId)
      .single();

    if (participantError || !participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant request not found'
      });
    }

    // Use the simple database function to update participant and create notifications
    try {
      const result = await supabase
        .rpc('update_participant_status', {
          p_participant_id: req.params.requestId,
          p_new_status: action,
          p_current_user_id: req.user.id
        });
        
      if (!result?.success) {
        throw new Error(result?.error || 'Update failed');
      }
      
      updateResult = result;
      console.log(`✅ Participant status updated with notifications:`, updateResult);
    
    // Emit real-time Socket.IO updates
    const io = req.app.get('io');
    if (io) {
      // Emit to the PASSENGER whose request was processed
      const passengerUserId = result.participant_updated?.user_id;
      if (passengerUserId) {
        io.to(`user-${passengerUserId}`).emit('notification', {
          type: action === 'accept' ? 'join_accepted' : 'join_rejected',
          title: action === 'accept' ? 'Join Request Accepted' : 'Join Request Rejected',
          message: `Your join request has been ${action}ed!`,
          data: {
            participant_id: req.params.requestId,
            announcement_id: req.params.id,
            action: action,
            whatsapp_phone: action === 'accept' ? result.participant_updated?.phone_number : null
          }
        });
      }

      // Emit announcement update to announcement room
      io.to(`announcement-${req.params.id}`).emit('announcement-updated', {
        type: 'participant_updated',
        announcement_id: req.params.id,
        participant_id: req.params.requestId,
        action: action,
        participant: result.participant_updated
      });

      console.log(`📡 Socket.IO notification sent for ${action} action to user ${passengerUserId}`);
    }
    } catch (err) {
      console.error('❌ Failed to update participant status:', err.message);
      updateError = err;
    }
    
    // Get updated participant record for response
    const { data: updatedParticipant } = await supabase
      .from('announcement_participants')
      .select('id, user_id, announcement_id, status, joined_at')
      .eq('id', req.params.requestId)
      .single();

    // Get user details for response message
    const { data: participantUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', participant.user_id)
      .single();

    // The database function already handles notifications, co-passenger notifications, and cleanup
    // Just emit real-time notification for immediate UI updates
    if (io && participant.user_id) {
      io.to(`user-${participant.user_id}`).emit('notification', {
        type: action === 'accept' ? 'join_accepted' : 'join_rejected',
        title: action === 'accept' ? 'Join Request Accepted' : 'Join Request Rejected',
        message: `Your request to join ${announcement.start_location_name} to ${announcement.destination_name} was ${action}ed`,
        data: {
          announcement_id: req.params.id,
          action: action,
          participant_id: req.params.requestId
        }
      });
    }

    res.json({
      success: true,
      message: `You have ${action}ed ${participantUser?.name || 'the user'}'s request to join your ride from ${announcement.start_location_name} to ${announcement.destination_name}`,
      data: updatedParticipant,
      notification_result: updateResult?.notification_result || null
    });
  } catch (error) {
    console.error('Respond to join request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to join request'
    });
  }
});

// Accept join request (old endpoint - keeping for compatibility)
router.put('/:id/accept/:requestId', authenticateToken, async (req, res) => {
  try {
    const announcement = await AnnouncementService.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is the announcement creator
    const ownerId = announcement.created_by?.id;
    if (ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the announcement creator can accept join requests'
      });
    }

    // Update participant status to 'accepted'
    let participant;
    try {
      participant = await AnnouncementService.updateParticipantStatusById(
        req.params.requestId, 
        'accepted'
      );
      console.log('✅ Participant updated successfully:', participant.id);
    } catch (updateError) {
      console.error('❌ Failed to update participant:', updateError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update participant status',
        error: updateError.message
      });
    }

    // Get participant user details
    const { data: participantUser } = await supabase
      .from('users')
      .select('name, phone_number')
      .eq('id', participant.user_id)
      .single();

    // Get announcement creator's phone number for WhatsApp
    const { data: creatorUser } = await supabase
      .from('users')
      .select('name, phone_number')
      .eq('id', req.user.id)
      .single();

    // Create notification for the user who was accepted with creator's phone number
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: participant.user_id,
        sender_id: req.user.id,
        type: 'join_accepted',
        title: 'Join Request Accepted',
        message: `Your join request for ${announcement.start_location_name} to ${announcement.destination_name} has been accepted!`,
        announcement_id: req.params.id,
        request_id: req.params.requestId,
        status: 'accepted',
        related_user_phone: creatorUser?.phone_number || null
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Failed to create acceptance notification:', notificationError);
      console.error('Notification error details:', {
        recipient_id: participant.user_id,
        sender_id: req.user.id,
        announcement_id: req.params.id,
        participant_id: req.params.requestId
      });
    } else {
      console.log(`✅ Acceptance notification created for participant ${participant.user_id}`);
      console.log('🔔 Notification details:', {
        recipient_id: participant.user_id,
        type: 'join_accepted',
        message: notification?.message,
        whatsapp_phone: creatorUser?.phone_number
      });
    }

    console.log(`🔔 Acceptance notification sent to: ${participantUser?.name || 'User'}`);

    // Emit real-time notification to the user who was accepted
    io.to(`user-${req.params.requestId}`).emit('notification', {
      type: 'join_accepted',
      title: 'Join Request Accepted',
      message: `Your join request for ${announcement.start_location_name} to ${announcement.destination_name} has been accepted!`,
      data: {
        announcement_id: req.params.id,
        sender: {
          id: req.user.id,
          name: req.user.name
        },
        participant: participant
      }
    });

    // Emit announcement update to announcement room
    io.to(`announcement-${req.params.id}`).emit('announcement-updated', {
      type: 'participant_accepted',
      announcement_id: req.params.id,
      participant: participant
    });

    console.log(`📡 Real-time acceptance notification sent to user ${req.params.requestId}`);

    // Notify other co-passengers when someone gets accepted
    try {
      console.log('🔍 [OLD ENDPOINT] Looking for other co-passengers to notify...');
      
      // Get all other participants for this announcement (excluding the newly accepted user)
      const { data: otherParticipants } = await supabase
        .from('announcement_participants')
        .select('user_id, status')
        .eq('announcement_id', req.params.id)
        .neq('user_id', participant.user_id); // Exclude the newly accepted user

      console.log('📊 [OLD ENDPOINT] Found other participants:', otherParticipants);

      if (otherParticipants && otherParticipants.length > 0) {
        // Only notify participants who are already accepted
        const acceptedParticipants = otherParticipants.filter(p => p.status === 'accepted');
        console.log('✅ [OLD ENDPOINT] Accepted participants to notify:', acceptedParticipants);

        if (acceptedParticipants.length > 0) {
          // Create database notifications for other co-passengers
          const coPassengerNotifications = acceptedParticipants.map(otherParticipant => ({
            recipient_id: otherParticipant.user_id,
            sender_id: req.user.id,
            type: 'new_co_passenger',
            title: 'New Co-Passenger Joined',
            message: `${participantUser?.name || 'A new passenger'} has been accepted to join your ride from ${announcement.start_location_name} to ${announcement.destination_name}!`,
            announcement_id: req.params.id,
            status: 'info'
          }));

          console.log('📝 [OLD ENDPOINT] Creating notifications:', coPassengerNotifications);

          // Insert notifications into database
          const { error: dbNotificationError } = await supabase
            .from('notifications')
            .insert(coPassengerNotifications);

          if (dbNotificationError) {
            console.error('Failed to create co-passenger notifications in database:', dbNotificationError);
          } else {
            console.log(`✅ [OLD ENDPOINT] Successfully created ${coPassengerNotifications.length} database notifications for co-passengers`);
          }

          // Send real-time notifications
          acceptedParticipants.forEach(otherParticipant => {
            io.to(`user-${otherParticipant.user_id}`).emit('notification', {
              type: 'new_co_passenger',
              title: 'New Co-Passenger Joined',
              message: `${participantUser?.name || 'A new passenger'} has been accepted to join your ride from ${announcement.start_location_name} to ${announcement.destination_name}!`,
              data: {
                announcement_id: req.params.id,
                new_participant: {
                  id: participant.user_id,
                  name: participantUser?.name || 'Unknown'
                },
                sender: { id: req.user.id, name: req.user.name }
              }
            });
          });
          console.log(`📡 [OLD ENDPOINT] Sent real-time notifications to ${acceptedParticipants.length} co-passengers`);
        } else {
          console.log('ℹ️ [OLD ENDPOINT] No other accepted participants to notify');
        }
      } else {
        console.log('ℹ️ [OLD ENDPOINT] No other participants found for this announcement');
      }
    } catch (notifyError) {
      console.error('Error notifying other co-passengers (old accept endpoint):', notifyError);
    }

    // Mark the original join request notification as read/delete it
    try {
      const { error: deleteNotificationError } = await supabase
        .from('notifications')
        .delete()
        .eq('type', 'join_request')
        .eq('announcement_id', req.params.id)
        .eq('sender_id', participant.user_id);

      if (deleteNotificationError) {
        console.error('Failed to delete join request notification:', deleteNotificationError);
      } else {
        console.log('🗑️ Deleted original join request notification');
      }
    } catch (deleteError) {
      console.error('Error deleting notification:', deleteError);
    }

    res.json({
      success: true,
      message: `You have accepted ${participantUser?.name || 'the user'}\u2019s request to join your ride from ${announcement.start_location_name} to ${announcement.destination_name}`,
      data: participant,
      notification: notification || null
    });
  } catch (error) {
    console.error('Accept join request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept join request'
    });
  }
});

// Reject join request
router.put('/:id/reject/:requestId', authenticateToken, async (req, res) => {
  try {
    const announcement = await AnnouncementService.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is the announcement creator
    const ownerId = announcement.created_by?.id;
    if (ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the announcement creator can reject join requests'
      });
    }

    // Update participant status to 'rejected'
    const participant = await AnnouncementService.updateParticipantStatusById(
      req.params.requestId, 
      'rejected'
    );

    // Get participant user details
    const { data: participantUser } = await supabase
      .from('users')
      .select('name, phone_number')
      .eq('id', participant.user_id)
      .single();

    // Get announcement creator's phone number for consistency
    const { data: creatorUser } = await supabase
      .from('users')
      .select('name, phone_number')
      .eq('id', req.user.id)
      .single();

    // Create notification for the user who was rejected
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: participant.user_id,
        sender_id: req.user.id,
        type: 'join_rejected',
        title: 'Join Request Rejected',
        message: `Your join request for ${announcement.start_location_name} to ${announcement.destination_name} has been rejected.`,
        announcement_id: req.params.id,
        request_id: req.params.requestId,
        status: 'rejected',
        related_user_phone: creatorUser?.phone_number || null
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Failed to create rejection notification:', notificationError);
      console.error('Rejection notification error details:', {
        recipient_id: participant.user_id,
        sender_id: req.user.id,
        announcement_id: req.params.id,
        participant_id: req.params.requestId
      });
    } else {
      console.log(`✅ Rejection notification created for participant ${participant.user_id}`);
      console.log('🔔 Rejection notification details:', {
        recipient_id: participant.user_id,
        type: 'join_rejected',
        message: notification?.message
      });
    }

    console.log(`🔔 Rejection notification sent to: ${participantUser?.name || 'User'}`);

    // Emit real-time notification to the user who was rejected
    io.to(`user-${req.params.requestId}`).emit('notification', {
      type: 'join_rejected',
      title: 'Join Request Rejected',
      message: `Your join request for ${announcement.start_location_name} to ${announcement.destination_name} has been rejected.`,
      data: {
        announcement_id: req.params.id,
        sender: {
          id: req.user.id,
          name: req.user.name
        },
        participant: participant
      }
    });

    // Emit announcement update to announcement room
    io.to(`announcement-${req.params.id}`).emit('announcement-updated', {
      type: 'participant_rejected',
      announcement_id: req.params.id,
      participant: participant
    });

    console.log(`📡 Real-time rejection notification sent to user ${req.params.requestId}`);

    // Mark the original join request notification as read/delete it
    try {
      const { error: deleteNotificationError } = await supabase
        .from('notifications')
        .delete()
        .eq('type', 'join_request')
        .eq('announcement_id', req.params.id)
        .eq('sender_id', participant.user_id);

      if (deleteNotificationError) {
        console.error('Failed to delete join request notification:', deleteNotificationError);
      } else {
        console.log('🗑️ Deleted original join request notification');
      }
    } catch (deleteError) {
      console.error('Error deleting notification:', deleteError);
    }

    res.json({
      success: true,
      message: `You have rejected ${participantUser?.name || 'the user'}\u2019s request to join your ride from ${announcement.start_location_name} to ${announcement.destination_name}`,
      data: participant,
      notification: notification || null
    });
  } catch (error) {
    console.error('Reject join request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject join request'
    });
  }
});

// Leave announcement
router.delete('/:id/join', authenticateToken, async (req, res) => {
  try {
    await AnnouncementService.removeParticipant(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Left announcement successfully'
    });
  } catch (error) {
    console.error('Leave announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave announcement'
    });
  }
});

// Get user's announcements
router.get('/user/my-announcements', authenticateToken, async (req, res) => {
  try {
    const announcements = await AnnouncementService.findByUser(req.user.id, 'created');

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Get user announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user announcements'
    });
  }
});

// Get announcements user has joined
router.get('/user/joined-announcements', authenticateToken, async (req, res) => {
  try {
    const announcements = await AnnouncementService.findByUser(req.user.id, 'participated');

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Get joined announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch joined announcements'
    });
  }
});

// Get announcement participants
router.get('/:id/participants', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 Fetching participants for announcement: ${req.params.id}`);
    
    const announcement = await AnnouncementService.findById(req.params.id);

    if (!announcement) {
      console.log('❌ Announcement not found');
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    console.log(`✅ Announcement found: ${announcement.start_location_name} → ${announcement.destination_name}`);

    // Check if user is announcement creator
    const ownerId = announcement.created_by?.id;
    if (ownerId !== req.user.id) {
      console.log('❌ User not authorized');
      return res.status(403).json({
        success: false,
        message: 'Only announcement creator can view participants'
      });
    }

    // Get all participants for this announcement
    const { data: participants, error } = await supabase
      .from('announcement_participants')
      .select('*')
      .eq('announcement_id', req.params.id)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching participants:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch participants',
        error: error.message
      });
    }

    console.log(`👥 Found ${participants?.length || 0} participants`);

    // Get user details for each participant
    const participantsWithUsers = await Promise.all(
      (participants || []).map(async (participant) => {
        console.log(`🔍 Fetching user data for: ${participant.user_id}`);
        
        const { data: user, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            name,
            phone_number,
            code_number,
            email,
            verified,
            is_phone_verified,
            profile_picture,
            average_rating,
            completed_trips,
            total_trips,
            is_premium,
            created_at,
            last_active
          `)
          .eq('id', participant.user_id)
          .single();

        if (userError) {
          console.error(`❌ Error fetching user ${participant.user_id}:`, userError);
        } else {
          console.log(`✅ User found: ${user?.name || 'No name'}, Phone: ${user?.phone_number || 'No phone'}`);
        }

        return {
          ...participant,
          user: userError ? null : user
        };
      })
    );

    console.log(`📤 Returning ${participantsWithUsers.length} participants with user data`);

    res.json({
      success: true,
      data: participantsWithUsers,
      message: 'Participants retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Get participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participants',
      error: error.message
    });
  }
});

// Repost announcement (create duplicate)
router.post('/repost/:announcementId', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    // Get original announcement
    const { data: originalAnnouncement, error: fetchError } = await supabase
      .from('announcements')
      .select(`
        *,
        created_by:users(id, name, email, phone_number)
      `)
      .eq('id', announcementId)
      .single();
    
    if (fetchError || !originalAnnouncement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    // Check if user is the original creator
    if (originalAnnouncement.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the original creator can repost this announcement'
      });
    }
    
    // Create new announcement with same data
    const { data: newAnnouncement, error: createError } = await supabase
      .from('announcements')
      .insert({
        start_location_name: originalAnnouncement.start_location_name,
        start_location: originalAnnouncement.start_location,
        destination_name: originalAnnouncement.destination_name,
        destination: originalAnnouncement.destination,
        date: originalAnnouncement.date,
        time: originalAnnouncement.time,
        price: originalAnnouncement.price,
        passenger_capacity: originalAnnouncement.passenger_capacity,
        vehicle_type: originalAnnouncement.vehicle_type,
        comfort_level: originalAnnouncement.comfort_level,
        seat_preference: originalAnnouncement.seat_preference,
        route_type: originalAnnouncement.route_type,
        smoking_preference: originalAnnouncement.smoking_preference,
        alcohol_preference: originalAnnouncement.alcohol_preference,
        music_preference: originalAnnouncement.music_preference,
        conversation_preference: originalAnnouncement.conversation_preference,
        pets_preference: originalAnnouncement.pets_preference,
        ac_preference: originalAnnouncement.ac_preference,
        luggage_preference: originalAnnouncement.luggage_preference,
        gender_preference: originalAnnouncement.gender_preference,
        notes: originalAnnouncement.notes,
        created_by: req.user.id
      })
      .select(`
        *,
        created_by:users(id, name, email, phone_number)
      `)
      .single();
    
    if (createError) {
      console.error('Repost announcement error:', createError);
      return res.status(500).json({
        success: false,
        message: 'Failed to repost announcement'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Announcement reposted successfully',
      data: newAnnouncement
    });
    
  } catch (error) {
    console.error('Repost announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to repost announcement'
    });
  }
});

module.exports = router;
