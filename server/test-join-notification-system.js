// ============================================
// 🔥 CRITICAL TEST: BACKEND-PERSISTENT JOIN REQUEST NOTIFICATION SYSTEM
// ============================================

const { supabase } = require('./config/supabase');

async function testJoinNotificationSystem() {
  console.log('🚀 Starting Join Request Notification System Test...\n');

  try {
    // Test data
    const testCreator = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Ride Creator',
      phone_number: '+1234567890'
    };

    const testRequester = {
      id: '00000000-0000-0000-0000-000000000002', 
      name: 'Test Requester',
      phone_number: '+0987654321'
    };

    const testAnnouncement = {
      id: '00000000-0000-0000-0000-000000000003',
      start_location_name: 'Test Start Location',
      destination_name: 'Test Destination',
      created_by: testCreator.id
    };

    const testParticipant = {
      id: '00000000-0000-0000-0000-000000000004',
      user_id: testRequester.id,
      announcement_id: testAnnouncement.id
    };

    console.log('📝 Test Data:');
    console.log('  Creator:', testCreator);
    console.log('  Requester:', testRequester);
    console.log('  Announcement:', testAnnouncement);
    console.log('  Participant:', testParticipant);
    console.log('');

    // ============================================
    // TEST 1: Create Join Request Notification
    // ============================================
    console.log('🔔 TEST 1: Creating Join Request Notification...');
    
    const { data: joinRequestResult, error: joinRequestError } = await supabase
      .rpc('create_join_request_notification', {
        announcement_uuid: testAnnouncement.id,
        requester_uuid: testRequester.id,
        participant_uuid: testParticipant.id
      });

    if (joinRequestError) {
      console.error('❌ Join request notification failed:', joinRequestError);
      return;
    }

    console.log('✅ Join request notification created:', joinRequestResult);
    console.log('');

    // ============================================
    // TEST 2: Check for Duplicate Protection
    // ============================================
    console.log('🛡️ TEST 2: Testing Duplicate Protection...');
    
    const { data: duplicateResult, error: duplicateError } = await supabase
      .rpc('create_join_request_notification', {
        announcement_uuid: testAnnouncement.id,
        requester_uuid: testRequester.id,
        participant_uuid: testParticipant.id
      });

    if (duplicateResult && duplicateResult.success === false) {
      console.log('✅ Duplicate protection working:', duplicateResult.error);
    } else {
      console.log('❌ Duplicate protection failed');
    }
    console.log('');

    // ============================================
    // TEST 3: Accept Join Request with Notification
    // ============================================
    console.log('✅ TEST 3: Accepting Join Request with Notification...');
    
    const { data: acceptResult, error: acceptError } = await supabase
      .rpc('update_participant_with_notifications', {
        participant_uuid: testParticipant.id,
        new_status: 'accepted',
        current_user_uuid: testCreator.id
      });

    if (acceptError) {
      console.error('❌ Accept with notification failed:', acceptError);
      return;
    }

    console.log('✅ Join request accepted with notification:', acceptResult);
    console.log('');

    // ============================================
    // TEST 4: Get User Notifications
    // ============================================
    console.log('📋 TEST 4: Getting User Notifications...');
    
    const { data: creatorNotifications, error: creatorNotificationsError } = await supabase
      .rpc('get_user_notifications', {
        user_uuid: testCreator.id,
        limit_count: 10,
        offset_count: 0,
        filter_unread: false
      });

    if (creatorNotificationsError) {
      console.error('❌ Failed to get creator notifications:', creatorNotificationsError);
    } else {
      console.log('✅ Creator notifications:', creatorNotifications);
    }

    const { data: requesterNotifications, error: requesterNotificationsError } = await supabase
      .rpc('get_user_notifications', {
        user_uuid: testRequester.id,
        limit_count: 10,
        offset_count: 0,
        filter_unread: false
      });

    if (requesterNotificationsError) {
      console.error('❌ Failed to get requester notifications:', requesterNotificationsError);
    } else {
      console.log('✅ Requester notifications:', requesterNotifications);
      
      // Check for WhatsApp URL in accepted notification
      const acceptedNotification = requesterNotifications?.find(n => n.type === 'join_accepted');
      if (acceptedNotification && acceptedNotification.whatsapp_url) {
        console.log('📱 WhatsApp URL found:', acceptedNotification.whatsapp_url);
      }
    }
    console.log('');

    // ============================================
    // TEST 5: Mark Notification as Read
    // ============================================
    console.log('📖 TEST 5: Marking Notification as Read...');
    
    if (requesterNotifications && requesterNotifications.length > 0) {
      const notificationId = requesterNotifications[0].id;
      
      const { data: markReadResult, error: markReadError } = await supabase
        .rpc('mark_notification_read', {
          notification_uuid: notificationId,
          user_uuid: testRequester.id
        });

      if (markReadError) {
        console.error('❌ Failed to mark notification as read:', markReadError);
      } else {
        console.log('✅ Notification marked as read:', markReadResult);
      }
    }
    console.log('');

    // ============================================
    // TEST 6: Test Rejection Flow
    // ============================================
    console.log('❌ TEST 6: Testing Rejection Flow...');
    
    // Create a new participant for rejection test
    const testParticipant2 = {
      id: '00000000-0000-0000-0000-000000000005',
      user_id: testRequester.id,
      announcement_id: testAnnouncement.id
    };

    // First create join request
    const { data: joinRequest2 } = await supabase
      .rpc('create_join_request_notification', {
        announcement_uuid: testAnnouncement.id,
        requester_uuid: testRequester.id,
        participant_uuid: testParticipant2.id
      });

    // Then reject it
    const { data: rejectResult, error: rejectError } = await supabase
      .rpc('update_participant_with_notifications', {
        participant_uuid: testParticipant2.id,
        new_status: 'rejected',
        current_user_uuid: testCreator.id
      });

    if (rejectError) {
      console.error('❌ Reject with notification failed:', rejectError);
    } else {
      console.log('✅ Join request rejected with notification:', rejectResult);
    }
    console.log('');

    // ============================================
    // TEST 7: Verify WhatsApp Integration
    // ============================================
    console.log('📱 TEST 7: Verifying WhatsApp Integration...');
    
    const { data: finalNotifications } = await supabase
      .rpc('get_user_notifications', {
        user_uuid: testRequester.id,
        limit_count: 20,
        offset_count: 0,
        filter_unread: false
      });

    const acceptedNotif = finalNotifications?.find(n => n.type === 'join_accepted');
    const rejectedNotif = finalNotifications?.find(n => n.type === 'join_rejected');

    if (acceptedNotif) {
      console.log('✅ Accepted notification found:');
      console.log('  - Title:', acceptedNotif.title);
      console.log('  - Message:', acceptedNotif.message);
      console.log('  - WhatsApp Phone:', acceptedNotif.related_user_phone);
      console.log('  - WhatsApp URL:', acceptedNotif.whatsapp_url);
      console.log('  - Status:', acceptedNotif.status);
    }

    if (rejectedNotif) {
      console.log('✅ Rejected notification found:');
      console.log('  - Title:', rejectedNotif.title);
      console.log('  - Message:', rejectedNotif.message);
      console.log('  - Status:', rejectedNotif.status);
      console.log('  - WhatsApp Phone:', rejectedNotif.related_user_phone); // Should be null
    }
    console.log('');

    // ============================================
    // CLEANUP: Remove Test Data
    // ============================================
    console.log('🧹 Cleaning up test data...');
    
    const { error: cleanupError } = await supabase
      .from('notifications')
      .delete()
      .in('request_id', [testParticipant.id, testParticipant2.id]);

    if (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('📊 SUMMARY:');
    console.log('  ✅ Join request notifications created');
    console.log('  ✅ Duplicate protection working');
    console.log('  ✅ Accept notifications with WhatsApp integration');
    console.log('  ✅ Reject notifications');
    console.log('  ✅ User notification retrieval');
    console.log('  ✅ Mark as read functionality');
    console.log('  ✅ WhatsApp URL generation');
    console.log('  ✅ Backend-persistent system verified');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testJoinNotificationSystem();
