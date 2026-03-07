// Clean accept/reject endpoint without syntax errors
router.put('/:id/respond/:requestId', authenticateToken, async (req, res) => {
  console.log('🚀 ACCEPT/REJECT API CALLED:', req.method, '/announcements/' + req.params.id + '/respond/' + req.params.requestId);
  console.log('👤 User:', req.user.name, '(' + req.user.id + ')');
  console.log('📝 Action:', req.body.action);
  console.log('🎯 Target participant:', req.params.requestId);
  
  try {
    const { action } = req.body; // 'accept' or 'reject'
    
    if (!action || !['accept', 'reject'].includes(action)) {
      console.log('❌ Invalid action:', action);
      return res.status(400).json({
        success: false,
        message: 'Action must be either "accept" or "reject"'
      });
    }

    console.log('📋 Step 1: Fetching announcement', req.params.id, '...');
    const announcement = await AnnouncementService.findById(req.params.id);

    if (!announcement) {
      console.log('❌ Announcement not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    console.log('✅ Announcement found:', announcement.start_location_name, 'to', announcement.destination_name);

    // Check if user is announcement creator
    const ownerId = announcement.created_by_user?.id || announcement.created_by?.id;
    if (ownerId !== req.user.id) {
      console.log('❌ Permission denied: User', req.user.id, 'is not creator', ownerId);
      return res.status(403).json({
        success: false,
        message: 'Only announcement creator can respond to join requests'
      });
    }

    console.log('✅ User is creator, proceeding with', action, '...');

    // Update participant status
    let participant;
    try {
      const { data: updatedData, error: directError } = await supabase
        .from('announcement_participants')
        .update({ status: action })
        .eq('id', req.params.requestId)
        .select()
        .single();

      if (directError) {
        console.error('❌ Direct update failed, trying fallback:', directError.message);
        // Get participant data and create notification anyway
        const { data: existingParticipant } = await supabase
          .from('announcement_participants')
          .select('*')
          .eq('id', req.params.requestId)
          .single();
        
        participant = { ...existingParticipant, status: action };
      } else {
        participant = updatedData;
      }
      
      console.log('✅ Participant', action, 'ed successfully:', participant.id);
    } catch (updateError) {
      console.error('❌ Failed to', action, 'participant:', updateError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to', action, 'participant status',
        error: updateError.message
      });
    }

    // Get participant user details
    const { data: participantUser } = await supabase
      .from('users')
      .select('name, phone_number')
      .eq('id', participant.user_id)
      .single();

    // Get announcement creator's phone number
    const { data: creatorUser } = await supabase
      .from('users')
      .select('name, phone_number')
      .eq('id', req.user.id)
      .single();

    // Create notification for user who was responded to
    const notificationType = action === 'accept' ? 'join_accepted' : 'join_rejected';
    const notificationTitle = action === 'accept' ? 'Join Request Accepted' : 'Join Request Rejected';
    const notificationMessage = action === 'accept' 
      ? 'Your join request for ' + announcement.start_location_name + ' to ' + announcement.destination_name + ' has been accepted! Contact: ' + (creatorUser?.phone_number || 'N/A')
      : 'Your join request for ' + announcement.start_location_name + ' to ' + announcement.destination_name + ' has been rejected.';

    console.log('🔔 Creating', action, 'notification for user', participant.user_id);
    console.log('📝 Notification details:', {
      recipient_id: participant.user_id,
      sender_id: req.user.id,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      announcement_id: req.params.id
    });

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: participant.user_id,
        sender_id: req.user.id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        announcement_id: req.params.id,
        status: action,
        related_user_phone: creatorUser?.phone_number || null
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Failed to create', action, 'notification:', notificationError);
      console.error('❌ Notification error details:', {
        message: notificationError.message,
        details: notificationError.details,
        hint: notificationError.hint,
        code: notificationError.code
      });
    } else {
      console.log('✅', action, 'notification created successfully:', notification.id);
    }

    // Try to emit real-time notification
    try {
      if (io && participant.user_id) {
        io.to('user-' + participant.user_id).emit('notification', {
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          data: {
            announcement_id: req.params.id,
            sender: {
              id: req.user.id,
              name: req.user.name
            },
            participant: participant
          }
        });

        console.log('📡 Real-time', action, 'notification sent to user', participant.user_id);
      } else {
        console.log('⚠️ Socket.IO not available, skipping real-time notification');
      }
    } catch (socketError) {
      console.error('⚠️ Socket.IO error (continuing anyway):', socketError.message);
    }

    // Mark original join request notification as read/delete it
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
      message: 'You have', action, 'ed', (participantUser?.name || 'the user'), '\u2019s request to join your ride from', announcement.start_location_name, 'to', announcement.destination_name,
      data: participant,
      notification: notification || null
    });
  } catch (error) {
    console.error('Respond to join request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to', req.body?.action || 'respond to', 'join request'
    });
  }
});
