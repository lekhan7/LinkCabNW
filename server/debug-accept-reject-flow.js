// ============================================
// 🔧 DEBUG: Accept/Reject Notification Flow
// ============================================

const { supabase } = require('./config/supabase');

async function debugAcceptRejectFlow() {
  console.log('🔍 Debugging Accept/Reject Notification Flow...\n');

  try {
    // Test 1: Check RLS policies on notifications table
    console.log('🔍 TEST 1: Checking RLS policies...');
    
    const { data: rlsPolicies, error: rlsError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'notifications');

    if (rlsError) {
      console.error('❌ Failed to check RLS policies:', rlsError);
    } else {
      console.log('✅ Current RLS policies for notifications:');
      rlsPolicies?.forEach(policy => {
        console.log(`  Policy: ${policy.policyname}`);
        console.log(`  Roles: ${policy.roles}`);
        console.log(`  Command: ${policy.cmd}`);
        console.log(`  Qual: ${policy.qual}`);
        console.log('');
      });
    }

    console.log('');

    // Test 2: Check if we can manually insert a notification
    console.log('🔍 TEST 2: Testing manual notification insert...');
    
    const testNotification = {
      recipient_id: '00000000-0000-0000-0000-000000000002', // Replace with actual co-passenger ID
      sender_id: '00000000-0000-0000-0000-000000000001', // Replace with actual creator ID
      type: 'join_accepted',
      title: 'Test Accept Notification',
      message: 'Test: Your request was accepted',
      announcement_id: '00000000-0000-0000-0000-000000000003',
      request_id: '00000000-0000-0000-0000-000000000004',
      status: 'accepted',
      related_user_phone: '+1234567890'
    };

    console.log('📝 Test notification data:', testNotification);

    const { data: insertedNotification, error: insertError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Manual insert failed:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Manual insert successful:', insertedNotification.id);
      
      // Clean up
      await supabase
        .from('notifications')
        .delete()
        .eq('id', insertedNotification.id);
      
      console.log('🧹 Test notification cleaned up');
    }

    console.log('');

    // Test 3: Check recent notifications for co-passenger
    console.log('🔍 TEST 3: Checking recent notifications...');
    
    const { data: recentNotifications, error: recentError } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', '00000000-0000-0000-0000-000000000002') // Replace with actual co-passenger ID
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ Failed to fetch recent notifications:', recentError);
    } else {
      console.log(`✅ Found ${recentNotifications?.length || 0} recent notifications`);
      
      recentNotifications?.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.created_at} - ${notif.type}`);
        console.log(`     Recipient: ${notif.recipient_id}`);
        console.log(`     Sender: ${notif.sender_id}`);
        console.log(`     Message: ${notif.message}`);
        console.log(`     Status: ${notif.status}`);
        console.log(`     Is Read: ${notif.is_read}`);
        console.log('');
      });
    }

    console.log('');

    // Test 4: Check if there are any join_accepted notifications
    console.log('🔍 TEST 4: Checking specifically for join_accepted notifications...');
    
    const { data: acceptedNotifications, error: acceptedError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'join_accepted')
      .order('created_at', { ascending: false })
      .limit(5);

    if (acceptedError) {
      console.error('❌ Failed to fetch accepted notifications:', acceptedError);
    } else {
      console.log(`✅ Found ${acceptedNotifications?.length || 0} join_accepted notifications total`);
      
      // Filter for specific co-passenger
      const coPassengerAccepted = acceptedNotifications?.filter(
        notif => notif.recipient_id === '00000000-0000-0000-0000-000000000002'
      );
      
      console.log(`✅ Found ${coPassengerAccepted?.length || 0} join_accepted notifications for co-passenger`);
      
      coPassengerAccepted?.forEach((notif, index) => {
        console.log(`  Co-passenger Accepted ${index + 1}:`);
        console.log(`     ID: ${notif.id}`);
        console.log(`     Created: ${notif.created_at}`);
        console.log(`     Message: ${notif.message}`);
        console.log(`     WhatsApp: ${notif.related_user_phone}`);
        console.log('');
      });
    }

    console.log('');

    // Test 5: Simulate what the accept endpoint does
    console.log('🔍 TEST 5: Simulating accept endpoint logic...');
    
    // This simulates the exact logic in your accept endpoint
    const participantId = 'test-participant-id';
    const announcementId = 'test-announcement-id';
    const creatorId = 'test-creator-id';
    const requesterId = 'test-requester-id';
    
    console.log('📝 Simulating accept with:');
    console.log(`  Participant ID: ${participantId}`);
    console.log(`  Announcement ID: ${announcementId}`);
    console.log(`  Creator ID: ${creatorId}`);
    console.log(`  Requester ID: ${requesterId}`);

    // Step 1: Get participant
    const { data: participant, error: participantError } = await supabase
      .from('announcement_participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      console.error('❌ Participant not found:', participantError);
      return;
    }

    console.log('✅ Participant found:', participant.user_id);

    // Step 2: Get creator phone
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('phone_number')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      console.error('❌ Creator not found:', creatorError);
      return;
    }

    console.log('✅ Creator found with phone:', creator.phone_number);

    // Step 3: Create notification exactly like the endpoint
    const { data: acceptNotification, error: acceptError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: requesterId,
        sender_id: creatorId,
        type: 'join_accepted',
        title: 'Join Request Accepted',
        message: `Your join request for test route has been accepted!`,
        announcement_id: announcementId,
        status: 'accepted',
        related_user_phone: creator.phone_number
      })
      .select()
      .single();

    if (acceptError) {
      console.error('❌ Accept notification creation failed:', acceptError);
      console.error('Error details:', {
        message: acceptError.message,
        details: acceptError.details,
        hint: acceptError.hint
      });
    } else {
      console.log('✅ Accept notification created successfully:', acceptNotification.id);
      
      // Clean up
      await supabase
        .from('notifications')
        .delete()
        .eq('id', acceptNotification.id);
      
      console.log('🧹 Test accept notification cleaned up');
    }

  } catch (error) {
    console.error('💥 Debug test failed:', error);
  }
}

// Run the debug test
console.log('🚀 Starting Accept/Reject Flow Debug');
console.log('⚠️  IMPORTANT: Replace the test IDs with actual user IDs from your database');
console.log('');

debugAcceptRejectFlow();
