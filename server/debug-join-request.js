// ============================================
// 🔧 DEBUG: Test Join Request Endpoint
// ============================================

const { supabase } = require('./config/supabase');

async function testJoinRequest() {
  console.log('🔍 Testing join request endpoint...\n');

  try {
    // Test data
    const announcementId = '222eaecf-7bd9-4dba-a5bd-7d548c7e8698';
    const userId = 'test-user-id';
    
    console.log('📝 Test Data:');
    console.log('  Announcement ID:', announcementId);
    console.log('  User ID:', userId);
    console.log('');

    // Test 1: Check if announcement exists
    console.log('🔍 TEST 1: Checking announcement...');
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (announcementError) {
      console.error('❌ Announcement not found:', announcementError);
      return;
    }
    console.log('✅ Announcement found:', announcement);
    console.log('');

    // Test 2: Check available seats
    console.log('🔍 TEST 2: Checking available seats...');
    const { data: participants, error: participantsError } = await supabase
      .from('announcement_participants')
      .select('*')
      .eq('announcement_id', announcementId)
      .eq('status', 'accepted');

    if (participantsError) {
      console.error('❌ Failed to check participants:', participantsError);
      return;
    }

    const availableSeats = announcement.passenger_capacity - (participants?.length || 0);
    console.log('✅ Available seats:', availableSeats);
    console.log('');

    // Test 3: Try to add participant
    console.log('🔍 TEST 3: Adding participant...');
    const { data: newParticipant, error: addParticipantError } = await supabase
      .from('announcement_participants')
      .insert({
        announcement_id: announcementId,
        user_id: userId,
        status: 'requested'
      })
      .select()
      .single();

    if (addParticipantError) {
      console.error('❌ Failed to add participant:', addParticipantError);
      return;
    }
    console.log('✅ Participant added:', newParticipant);
    console.log('');

    // Test 4: Try to create notification (fallback method)
    console.log('🔍 TEST 4: Creating notification (fallback)...');
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: announcement.created_by,
        sender_id: userId,
        type: 'join_request',
        title: 'New Join Request',
        message: 'Test user wants to join your announcement',
        announcement_id: announcementId,
        request_id: newParticipant.id,
        status: 'pending'
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
    } else {
      console.log('✅ Notification created:', notification);
    }
    console.log('');

    // Test 5: Try the RPC function (if it exists)
    console.log('🔍 TEST 5: Testing RPC function...');
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('create_join_request_notification', {
          announcement_uuid: announcementId,
          requester_uuid: userId,
          participant_uuid: newParticipant.id
        });

      if (rpcError) {
        console.log('⚠️ RPC function not available:', rpcError.message);
      } else {
        console.log('✅ RPC function works:', rpcResult);
      }
    } catch (rpcErr) {
      console.log('⚠️ RPC function failed:', rpcErr.message);
    }
    console.log('');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await supabase.from('announcement_participants').delete().eq('id', newParticipant.id);
    await supabase.from('notifications').delete().eq('request_id', newParticipant.id);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testJoinRequest();
