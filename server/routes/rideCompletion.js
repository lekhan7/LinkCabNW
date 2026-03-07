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

// Complete ride (for creator or co-passenger)
router.post('/:announcementId/complete', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { completionType } = req.body; // 'creator' or 'participant'

    if (!['creator', 'participant'].includes(completionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid completion type'
      });
    }

    // Get announcement details first
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('id, created_by, ride_completed, date, time')
      .eq('id', announcementId)
      .single();

    if (announcementError || !announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is creator (for now, only creators can complete rides)
    if (completionType === 'creator' && announcement.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the ride creator can complete the ride'
      });
    }

    // Check if ride is already completed
    if (announcement.ride_completed) {
      return res.status(400).json({
        success: false,
        message: 'Ride is already completed'
      });
    }

    // Check if ride time has passed
    const rideDateTime = new Date(`${announcement.date}T${announcement.time}`);
    const isTimePassed = rideDateTime <= new Date();

    if (!isTimePassed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete ride before the scheduled time'
      });
    }

    let result;

    // Try to use database function if available, otherwise use fallback
    try {
      console.log('🔍 Attempting to use database function for ride completion');
      const { data: dbResult, error: completionError } = await supabase
        .rpc('update_ride_completion_status', { 
          announcement_uuid: announcementId, 
          user_uuid: req.user.id, 
          completion_type: completionType 
        });

      console.log('📊 Database function result:', { dbResult, completionError });

      if (!completionError && dbResult) {
        console.log('✅ Database function succeeded');
        result = dbResult;
      } else {
        console.log('❌ Database function failed, using fallback');
        throw completionError || new Error('Database function failed');
      }
    } catch (funcError) {
      console.log('Database function not available, using fallback logic');
      
      // Fallback: Simply mark the ride as completed
      console.log('🔄 Using fallback logic to complete ride:', announcementId);
      const { error: updateError, data: updateData } = await supabase
        .from('announcements')
        .update({ 
          ride_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', announcementId)
        .select()
        .single();

      console.log('💾 Ride completion update result:', { updateError, updateData });

      if (updateError) {
        console.error('❌ Failed to update ride completion:', updateError);
        throw updateError;
      }

      result = {
        success: true,
        completion_status: 'completed',
        all_completed: true,
        participant_count: 0,
        completed_count: 1
      };
    }

    // Send real-time notification
    if (io) {
      io.to(`announcement-${announcementId}`).emit('ride_completion_updated', {
        announcement_id: announcementId,
        completion_type: completionType,
        completed_by: req.user.id,
        completion_status: result.completion_status,
        all_completed: result.all_completed
      });
    }

    res.json({
      success: true,
      message: 'Ride completion recorded successfully',
      data: {
        completion_status: result.completion_status,
        participant_count: result.participant_count,
        completed_count: result.completed_count,
        all_completed: result.all_completed
      }
    });

  } catch (error) {
    console.error('Complete ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete ride'
    });
  }
});

// Get ride completion status
router.get('/:announcementId/completion-status', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;

    // Get announcement details first
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select(`
        id,
        ride_completed,
        completed_at,
        date,
        time,
        created_by,
        created_by:users(id, name, profile_picture)
      `)
      .eq('id', announcementId)
      .single();

    if (announcementError || !announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is creator or participant
    const isCreator = announcement.created_by === req.user.id;
    const { data: participant } = await supabase
      .from('announcement_participants')
      .select('id, status')
      .eq('announcement_id', announcementId)
      .eq('user_id', req.user.id)
      .eq('status', 'accepted')
      .single();

    const isParticipant = !!participant;

    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this completion status'
      });
    }

    // Check if ride time has passed
    const rideDateTime = new Date(`${announcement.date}T${announcement.time}`);
    const isTimePassed = rideDateTime <= new Date();

    // Determine if user can complete the ride
    let canCompleteResult = {
      can_complete: false,
      completion_type: null,
      is_creator: isCreator,
      is_participant: isParticipant,
      already_completed: announcement.ride_completed,
      is_time_passed: isTimePassed
    };

    // Try to use database function if available, otherwise use fallback logic
    try {
      const { data: dbResult, error: permissionError } = await supabase
        .rpc('can_complete_ride', { 
          announcement_uuid: announcementId, 
          user_uuid: req.user.id
        });

      if (!permissionError && dbResult) {
        canCompleteResult = dbResult;
      }
    } catch (funcError) {
      console.log('Database function not available, using fallback logic');
      // Use fallback logic
      if (isCreator && !announcement.ride_completed && isTimePassed) {
        canCompleteResult = {
          ...canCompleteResult,
          can_complete: true,
          completion_type: 'creator'
        };
      }
    }

    // Get participants completion status
    const { data: participants, error: participantsError } = await supabase
      .from('announcement_participants')
      .select(`
        id,
        user_id,
        status,
        user:users(id, name, profile_picture)
      `)
      .eq('announcement_id', announcementId)
      .eq('status', 'accepted');

    if (participantsError) {
      console.error('Failed to fetch participants:', participantsError);
    }

    // Get completion statuses for all participants
    const { data: completionStatuses, error: statusesError } = await supabase
      .from('announcement_completion_status')
      .select('*')
      .eq('announcement_id', announcementId);

    if (statusesError) {
      console.error('Failed to fetch completion statuses:', statusesError);
    }

    // Combine participant data with completion status
    const participantsWithStatus = (participants || []).map(participant => {
      const completionStatus = completionStatuses?.find(s => s.user_id === participant.user_id);
      return {
        ...participant,
        completed: completionStatus?.completed || false,
        reviewed: completionStatus?.reviewed || false
      };
    });

    // Add creator to participants list
    const creatorCompletionStatus = completionStatuses?.find(s => s.user_id === announcement.created_by);
    const allParticipants = [
      {
        id: announcement.created_by,
        user_id: announcement.created_by,
        name: announcement.created_by?.name,
        profile_picture: announcement.created_by?.profile_picture,
        status: 'creator',
        completed: creatorCompletionStatus?.completed || false,
        reviewed: creatorCompletionStatus?.reviewed || false
      },
      ...participantsWithStatus
    ];

    res.json({
      success: true,
      data: {
        announcement: {
          id: announcement.id,
          ride_completed: announcement.ride_completed,
          completed_at: announcement.completed_at
        },
        participants: allParticipants,
        current_user: canCompleteResult
      }
    });

  } catch (error) {
    console.error('Get completion status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completion status'
    });
  }
});

// Get completion events for audit
router.get('/:announcementId/completion-events', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;

    // Verify user is part of this ride
    const { data: announcement } = await supabase
      .from('announcements')
      .select('created_by')
      .eq('id', announcementId)
      .single();

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const isCreator = announcement.created_by === req.user.id;
    const { data: participant } = await supabase
      .from('announcement_participants')
      .select('id')
      .eq('announcement_id', announcementId)
      .eq('user_id', req.user.id)
      .eq('status', 'accepted')
      .single();

    const isParticipant = !!participant;

    if (!isCreator && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these events'
      });
    }

    // Get completion events
    const { data: events, error } = await supabase
      .from('ride_completion_events')
      .select(`
        id,
        completion_type,
        completed_at,
        ip_address,
        user_agent,
        user:users(id, name, email)
      `)
      .eq('announcement_id', announcementId)
      .order('completed_at', { ascending: true });

    if (error) {
      console.error('Failed to get completion events:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get completion events'
      });
    }

    res.json({
      success: true,
      data: events || []
    });

  } catch (error) {
    console.error('Get completion events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completion events'
    });
  }
});

module.exports = router;
