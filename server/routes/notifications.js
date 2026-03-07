const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { auth } = require('../middleware/auth');

// Get notifications for a user
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;
    
    const { data: notifications, error } = await supabase
      .rpc('get_user_notifications', {
        p_user_id: req.user.id,
        p_limit: parseInt(limit),
        p_offset: parseInt(offset),
        p_filter_unread: unreadOnly === 'true'
      });

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }

    console.log(`✅ Found ${notifications?.length || 0} notifications for user ${req.user.id}`);

    res.json({
      success: true,
      data: notifications || [],
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Handle notification actions (accept/reject)
router.post('/:id/action', auth, async (req, res) => {
  try {
    const { id: notificationId } = req.params;
    const { action } = req.body;

    console.log(`🔔 Notification action request:`, {
      notificationId,
      action,
      userId: req.user.id,
      body: req.body
    });

    if (!['accept', 'reject'].includes(action)) {
      console.log(`❌ Invalid action: ${action}. Expected: accept or reject`);
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be accept or reject'
      });
    }

    // Get notification details
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('recipient_id', req.user.id)
      .single();

    if (notifError || !notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (!notification.request_id) {
      return res.status(400).json({
        success: false,
        message: 'This notification cannot be acted upon'
      });
    }

    // Map the action to the correct database status
    const mappedAction = action === 'accept' ? 'accepted' : 'rejected';
    
    // Update participant status
    const { data: result, error: updateError } = await supabase
      .rpc('update_participant_status', {
        p_participant_id: notification.request_id,
        p_new_status: mappedAction,
        p_current_user_id: req.user.id
      });

    if (updateError || !result?.success) {
      console.error(`Failed to ${action} participant:`, updateError || result?.error);
      
      // Check if this is UUID syntax error from RPC function (either in updateError or result.error)
      const hasUUIDError = (updateError?.message?.includes('invalid input syntax for type uuid')) ||
                         (result?.error?.includes('invalid input syntax for type uuid'));
      
      if (hasUUIDError) {
        // This is known RPC issue - handle gracefully by creating notification manually
        console.log('🔧 Handling known RPC UUID issue - creating notification manually');
        
        // Extract participant info from the original notification
        const { data: participantInfo } = await supabase
          .from('announcement_participants')
          .select(`
            *,
            users!inner(
              id,
              phone_number,
              name
            )
          `)
          .eq('id', notification.request_id)
          .single();
        
        if (participantInfo) {
          // Update participant status manually
          const { error: statusUpdateError } = await supabase
            .from('announcement_participants')
            .update({ status: mappedAction })
            .eq('id', notification.request_id);
          
          if (statusUpdateError) {
            console.error('Failed to update participant status manually:', statusUpdateError);
          }
          
          // Create notification manually
          const notificationData = {
            recipient_id: participantInfo.user_id,
            sender_id: req.user.id,
            type: action === 'accept' ? 'join_accepted' : 'join_rejected',
            title: action === 'accept' ? 'Join Request Accepted! 🎉' : 'Join Request Rejected',
            message: action === 'accept' 
              ? `Your ride request has been accepted! Contact the driver on WhatsApp to coordinate details.`
              : `Your ride request was not accepted. Please try other available rides.`,
            announcement_id: notification.announcement_id,
            request_id: notification.request_id,
            related_user_phone: action === 'accept' ? participantInfo.users.phone_number : null,
            status: action === 'accept' ? 'accepted' : 'rejected',
            is_read: false
          };
          
          const { data: newNotification, error: newNotifError } = await supabase
            .from('notifications')
            .insert(notificationData)
            .select()
            .single();
          
          if (newNotifError) {
            console.error('Failed to create manual notification:', newNotifError);
          } else {
            console.log('✅ Manual notification created successfully:', newNotification.id);
          }
          
          // Mark original notification as read
          await supabase.rpc('mark_notification_read', {
            p_notification_id: notificationId,
            p_user_id: req.user.id
          });
          
          return res.json({
            success: true,
            message: `Request ${action}ed successfully`,
            data: {
              participant_updated: {
                id: participantInfo.id,
                user_id: participantInfo.user_id,
                status: action === 'accept' ? 'accepted' : 'rejected',
                phone_number: participantInfo.users.phone_number
              }
            }
          });
        }
      }
      
      return res.status(500).json({
        success: false,
        message: `Failed to ${action} request`,
        error: updateError?.message || result?.error
      });
    }

    // Validate and extract safe values from RPC result
    const participant = result?.participant_updated || null;
    
    if (!participant) {
      console.warn("Participant update returned no participant data");
      return res.json({
        success: true,
        message: "Request processed but no participant data returned"
      });
    }

    const passengerUserId = participant?.user_id;
    const passengerPhone = participant?.phone_number;

    // Validate that we have required UUID values
    if (!passengerUserId || !notification.announcement_id || !notification.request_id) {
      console.error("Missing required UUID values for notification creation");
      return res.status(500).json({
        success: false,
        message: "Missing required data for notification creation"
      });
    }

    // Mark the original notification as read
    await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
      p_user_id: req.user.id
    });

    // Create notification for the requesting user
    if (passengerUserId) {
      const notificationData = {
        recipient_id: passengerUserId,
        sender_id: req.user.id,
        type: action === 'accept' ? 'join_accepted' : 'join_rejected',
        title: action === 'accept' ? 'Join Request Accepted! 🎉' : 'Join Request Rejected',
        message: action === 'accept' 
          ? `Your ride request has been accepted! Contact the driver on WhatsApp to coordinate details.`
          : `Your ride request was not accepted. Please try other available rides.`,
        announcement_id: notification.announcement_id,
        request_id: notification.request_id,
        related_user_phone: action === 'accept' ? passengerPhone : null,
        status: action === 'accept' ? 'accepted' : 'rejected',
        is_read: false
      };

      const { data: newNotification, error: newNotifError } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (newNotifError) {
        console.error('Failed to create notification for passenger:', newNotifError);
      } else {
        console.log(`✅ Created ${action} notification for passenger:`, newNotification);
      }
    }

    // Emit real-time Socket.IO updates
    const io = req.app.get('io');
    if (io) {
      // Emit to the PASSENGER whose request was processed
      if (passengerUserId) {
        io.to(`user-${passengerUserId}`).emit('notification', {
          type: action === 'accept' ? 'join_accepted' : 'join_rejected',
          title: action === 'accept' ? 'Join Request Accepted! 🎉' : 'Join Request Rejected',
          message: action === 'accept' 
            ? `Your ride request has been accepted! Contact the driver on WhatsApp to coordinate details.`
            : `Your ride request was not accepted. Please try other available rides.`,
          data: {
            participant_id: notification.request_id,
            announcement_id: notification.announcement_id,
            action: action,
            whatsapp_phone: action === 'accept' ? passengerPhone : null
          }
        });
      }

      // Emit announcement update to announcement room
      io.to(`announcement-${notification.announcement_id}`).emit('announcement-updated', {
        type: 'participant_updated',
        announcement_id: notification.announcement_id,
        participant_id: notification.request_id,
        action: action,
        participant: participant
      });

      console.log(`📡 Socket.IO notification sent for ${action} action to user ${passengerUserId}`);
    }

    console.log(`✅ Successfully ${action}ed participant ${notification.request_id}`);

    res.json({
      success: true,
      message: `Request ${action}ed successfully`,
      data: result
    });

  } catch (error) {
    console.error('Notification action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process action',
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id: notificationId } = req.params;

    const { data: result, error } = await supabase
      .rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_user_id: req.user.id
      });

    if (error) {
      console.error('Failed to mark notification as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id: notificationId } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', req.user.id);

    if (error) {
      console.error('Failed to delete notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .rpc('get_user_notifications', {
        p_user_id: req.user.id,
        p_limit: 1000,
        p_offset: 0,
        p_filter_unread: true
      });

    if (error) {
      console.error('Failed to get unread count:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }

    const unreadCount = notifications?.length || 0;

    res.json({
      success: true,
      data: { unreadCount },
      message: 'Unread count retrieved successfully'
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

// Create test notification (for development)
router.post('/test', auth, async (req, res) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: req.user.id,
        sender_id: req.user.id, // Self notification for testing
        type: 'join_request',
        title: 'Test Join Request',
        message: 'This is a test notification to check if the system works! Click Accept or Reject to test the buttons.',
        announcement_id: null,
        request_id: null,
        related_user_phone: '+1234567890',
        status: 'pending',
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create test notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create test notification',
        error: error.message
      });
    }

    console.log('✅ Test notification created:', notification);

    res.json({
      success: true,
      message: 'Test notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: error.message
    });
  }
});

// Direct query endpoint (fallback for RPC issues)
router.post('/direct', auth, async (req, res) => {
  try {
    const { recipient_id, limit = 10 } = req.body;
    
    console.log('🔍 Direct query for recipient:', recipient_id);
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        id,
        sender_id,
        type,
        title,
        message,
        announcement_id,
        request_id,
        related_user_phone,
        status,
        is_read,
        read_at,
        created_at
      `)
      .eq('recipient_id', recipient_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Direct query error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }

    console.log('✅ Direct query result:', notifications);

    res.json({
      success: true,
      data: notifications || [],
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Direct query endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Create review notification
router.post('/review', auth, async (req, res) => {
  try {
    const { recipientId, reviewerName, rating, feedback, announcementId } = req.body;

    if (!recipientId || !reviewerName || !rating || !announcementId) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: recipientId, reviewerName, rating, announcementId'
      });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        sender_id: req.user.id,
        type: 'new_review',
        title: 'You received a new review! ⭐',
        message: `${reviewerName} rated you ${rating} stars${feedback ? ': ' + feedback : ''}`,
        announcement_id: announcementId,
        status: 'completed',
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create review notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create review notification',
        error: error.message
      });
    }

    console.log('✅ Review notification created:', notification);

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${recipientId}`).emit('new_review', {
        type: 'NEW_REVIEW',
        title: 'You received a new review! ⭐',
        message: `${reviewerName} rated you ${rating} stars`,
        rating: rating,
        feedback: feedback,
        announcement_id: announcementId,
        reviewer_name: reviewerName,
        notification_id: notification.id
      });
    }

    res.json({
      success: true,
      message: 'Review notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Create review notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review notification',
      error: error.message
    });
  }
});

// Create report notification
router.post('/report', auth, async (req, res) => {
  try {
    const { reportedUserId, reporterName, reason, announcementId } = req.body;

    if (!reportedUserId || !reporterName || !reason || !announcementId) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: reportedUserId, reporterName, reason, announcementId'
      });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: reportedUserId,
        sender_id: req.user.id,
        type: 'new_report',
        title: 'A report has been filed against you ⚠️',
        message: `${reporterName} reported you for: ${reason}`,
        announcement_id: announcementId,
        status: 'reported',
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create report notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create report notification',
        error: error.message
      });
    }

    console.log('✅ Report notification created:', notification);

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${reportedUserId}`).emit('new_report', {
        type: 'NEW_REPORT',
        title: 'A report has been filed against you ⚠️',
        message: `${reporterName} reported you for: ${reason}`,
        reason: reason,
        announcement_id: announcementId,
        reporter_name: reporterName,
        notification_id: notification.id
      });
    }

    res.json({
      success: true,
      message: 'Report notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Create report notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report notification',
      error: error.message
    });
  }
});

module.exports = router;
