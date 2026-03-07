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

    // Check if user is creator OR participant (both can complete now)
    if (completionType === 'creator' && announcement.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the ride creator can use creator completion type'
      });
    }

    if (completionType === 'participant') {
      // Check if user is an accepted participant
      const { data: participant, error: participantError } = await supabase
        .from('announcement_participants')
        .select('*')
        .eq('announcement_id', announcementId)
        .eq('user_id', req.user.id)
        .eq('status', 'accepted')
        .single();

      if (participantError || !participant) {
        return res.status(403).json({
          success: false,
          message: 'Only accepted participants can complete rides'
        });
      }
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

    // New completion logic: Implement directly in code since DB functions might not be updated
    try {
      console.log('🔍 Using new completion logic based on reviews');
      
      // Count accepted participants (excluding creator)
      const { data: participants, error: participantsError } = await supabase
        .from('announcement_participants')
        .select('user_id')
        .eq('announcement_id', announcementId)
        .eq('status', 'accepted');

      const acceptedParticipants = participants?.length || 0;
      
      // Count reviews submitted for this announcement
      const { data: reviews, error: reviewsError } = await supabase
        .from('review_details')
        .select('id')
        .eq('announcement_id', announcementId);

      const reviewsCount = reviews?.length || 0;
      
      // Calculate required reviews
      let requiredReviews = 0;
      let allReviewsSubmitted = false;
      
      if (acceptedParticipants === 0) {
        // No co-passengers, creator can complete directly
        requiredReviews = 0;
        allReviewsSubmitted = true;
      } else {
        // Co-passengers exist, each should review the creator
        requiredReviews = acceptedParticipants;
        allReviewsSubmitted = (reviewsCount >= requiredReviews);
      }

      // Insert/update user completion status
      const { error: completionError } = await supabase
        .from('announcement_completion_status')
        .upsert({
          announcement_id: announcementId,
          user_id: req.user.id,
          completed: true
        }, {
          onConflict: 'announcement_id,user_id'
        });

      if (completionError) {
        console.error('Failed to update completion status:', completionError);
      }

      // Only mark announcement as completed when all required reviews are submitted
      let announcementUpdated = false;
      if (allReviewsSubmitted && !announcement.ride_completed) {
        const { error: updateError } = await supabase
          .from('announcements')
          .update({ 
            ride_completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', announcementId);

        if (!updateError) {
          announcementUpdated = true;
          console.log('✅ Announcement marked as completed');
        } else {
          console.error('Failed to update announcement:', updateError);
        }
      }

      result = {
        success: true,
        completion_status: allReviewsSubmitted ? 'completed' : 'pending_reviews',
        participant_count: acceptedParticipants + 1,
        accepted_participants: acceptedParticipants,
        reviews_count: reviewsCount,
        required_reviews: requiredReviews,
        all_reviews_submitted: allReviewsSubmitted,
        announcement_completed: announcement.ride_completed || announcementUpdated
      };

      console.log('📊 New completion logic result:', result);

    } catch (logicError) {
      console.error('New completion logic failed, using fallback:', logicError);
      
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
        all_completed: result.all_completed,
        all_participants_completed: result.all_participants_completed,
        all_participants_reviewed: result.all_participants_reviewed,
        participant_count: result.participant_count,
        completed_count: result.completed_count,
        reviewed_count: result.reviewed_count
      });
    }

    res.json({
      success: true,
      message: result.all_completed ? 
        'All required reviews submitted! Ride is now fully completed!' :
        'Your completion has been recorded. Waiting for all required reviews to be submitted.',
      data: {
        completion_status: result.completion_status,
        participant_count: result.participant_count,
        accepted_participants: result.accepted_participants,
        reviews_count: result.reviews_count,
        required_reviews: result.required_reviews,
        all_reviews_submitted: result.all_reviews_submitted,
        all_completed: result.all_reviews_submitted,
        announcement_completed: result.announcement_completed
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

    // Determine if user can complete the ride using new logic
    let canCompleteResult = {
      can_complete: false,
      completion_type: null,
      is_creator: isCreator,
      is_participant: isParticipant,
      already_completed: false,
      announcement_completed: announcement.ride_completed,
      is_time_passed: isTimePassed
    };

    // Use new completion logic directly in code
    try {
      // Check if user has already completed this ride
      const { data: userCompletion } = await supabase
        .from('announcement_completion_status')
        .select('completed')
        .eq('announcement_id', announcementId)
        .eq('user_id', req.user.id)
        .single();

      const alreadyCompleted = userCompletion?.completed || false;
      canCompleteResult.already_completed = alreadyCompleted;

      // Count accepted participants
      const { data: participants } = await supabase
        .from('announcement_participants')
        .select('user_id')
        .eq('announcement_id', announcementId)
        .eq('status', 'accepted');

      const acceptedParticipants = participants?.length || 0;
      
      // Count reviews submitted
      const { data: reviews } = await supabase
        .from('review_details')
        .select('id')
        .eq('announcement_id', announcementId);

      const reviewsCount = reviews?.length || 0;
      
      // Calculate required reviews
      let requiredReviews = 0;
      let allReviewsSubmitted = false;
      
      if (acceptedParticipants === 0) {
        requiredReviews = 0;
        allReviewsSubmitted = true;
      } else {
        requiredReviews = acceptedParticipants;
        allReviewsSubmitted = (reviewsCount >= requiredReviews);
      }

      // Determine if user can complete
      if ((isCreator || isParticipant) && !alreadyCompleted && !announcement.ride_completed && isTimePassed) {
        canCompleteResult.can_complete = true;
        canCompleteResult.completion_type = isCreator ? 'creator' : 'participant';
        canCompleteResult.accepted_participants = acceptedParticipants;
        canCompleteResult.reviews_count = reviewsCount;
        canCompleteResult.required_reviews = requiredReviews;
        canCompleteResult.all_reviews_submitted = allReviewsSubmitted;
        canCompleteResult.message = 'You can complete this ride';
      } else if (announcement.ride_completed) {
        canCompleteResult.message = 'Announcement already completed';
      } else if (alreadyCompleted) {
        canCompleteResult.message = 'You have already completed this ride';
      } else if (!isTimePassed) {
        canCompleteResult.message = 'Ride time has not passed yet';
      } else {
        canCompleteResult.message = 'You cannot complete this ride';
      }

    } catch (error) {
      console.error('Error checking completion status:', error);
      // Use fallback logic
      if (isCreator && !announcement.ride_completed && isTimePassed) {
        canCompleteResult = {
          ...canCompleteResult,
          can_complete: true,
          completion_type: 'creator',
          message: 'You can complete this ride'
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
