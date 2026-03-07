// ============================================
// 🔧 SIMPLE TEST: Join Request Fix Verification
// ============================================

const { supabase } = require('./config/supabase');

async function testJoinRequestSimple() {
  console.log('🔍 Testing Simple Join Request...\n');

  try {
    // Test the exact same flow as the API
    const announcementId = 'b990b50b-b39b-43e4-8153-53e81c6ee0e8'; // From your error log
    const userId = 'test-user-id'; // Replace with actual user ID
    
    console.log('📝 Using announcement ID from error:', announcementId);
    console.log('');

    // Step 1: Get announcement
    console.log('🔍 Step 1: Getting announcement...');
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (announcementError || !announcement) {
      console.error('❌ Announcement not found:', announcementError?.message || 'Unknown error');
      return;
    }
    console.log('✅ Announcement found:', announcement.id);
    console.log('');

    // Step 2: Add participant
    console.log('🔍 Step 2: Adding participant...');
    const { data: participant, error: participantError } = await supabase
      .from('announcement_participants')
      .insert({
        announcement_id: announcementId,
        user_id: userId,
        status: 'requested'
      })
      .select()
      .single();

    if (participantError) {
      console.error('❌ Failed to add participant:', participantError);
      return;
    }
    console.log('✅ Participant added:', participant.id);
    console.log('');

    // Step 3: Create notification (direct method - should work)
    console.log('🔍 Step 3: Creating notification...');
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: announcement.created_by,
        sender_id: userId,
        type: 'join_request',
        title: 'New Join Request',
        message: 'Test user wants to join your announcement',
        announcement_id: announcementId,
        request_id: participant.id,
        status: 'pending'
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
      console.error('Notification error details:', {
        recipient_id: announcement.created_by,
        sender_id: userId,
        announcement_id: announcementId,
        request_id: participant.id
      });
    } else {
      console.log('✅ Notification created successfully:', notification.id);
      console.log('🔔 Notification details:', {
        recipient: announcement.created_by,
        sender: userId,
        type: 'join_request',
        message: notification.message
      });
    }
    console.log('');

    // Step 4: Clean up
    console.log('🧹 Cleaning up test data...');
    await supabase.from('announcement_participants').delete().eq('id', participant.id);
    await supabase.from('notifications').delete().eq('id', notification.id);
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testJoinRequestSimple();
