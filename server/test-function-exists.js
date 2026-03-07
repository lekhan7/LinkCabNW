// ============================================
// 🔧 TEST: Check if Database Functions Exist
// ============================================

const { supabase } = require('./config/supabase');

async function testFunctionExists() {
  console.log('🔍 Testing if Database Functions Exist...\n');

  try {
    // Test 1: Check if get_user_notifications_fallback exists
    console.log('🔍 TEST 1: Testing get_user_notifications_fallback...');
    
    const { data: notifications, error: functionError } = await supabase
      .rpc('get_user_notifications_fallback', {
        user_uuid: 'f2b73849-b65e-4e0c-a2ec-2c3ba03ccfa4', // Co-passenger ID
        limit_count: 10,
        offset_count: 0,
        filter_unread: false
      });

    if (functionError) {
      console.error('❌ get_user_notifications_fallback function failed:', functionError);
      console.error('Error details:', {
        message: functionError.message,
        details: functionError.details,
        hint: functionError.hint,
        code: functionError.code
      });
      
      console.log('🔧 This means the function doesn\'t exist in Supabase!');
      console.log('📋 SOLUTION: Deploy the function to Supabase');
      console.log('📝 Run this in Supabase SQL Editor:');
      console.log('\\i fix-notification-errors.sql');
    } else {
      console.log('✅ get_user_notifications_fallback works!');
      console.log(`✅ Returned ${notifications?.length || 0} notifications`);
      
      notifications?.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.type} - ${notif.title}`);
        console.log(`     WhatsApp URL: ${notif.whatsapp_url || 'None'}`);
        console.log(`     Message: ${notif.message}`);
        console.log('');
      });
    }

    console.log('');

    // Test 2: Check if mark_notification_read_fallback exists
    console.log('🔍 TEST 2: Testing mark_notification_read_fallback...');
    
    if (notifications && notifications.length > 0) {
      const { data: markResult, error: markError } = await supabase
        .rpc('mark_notification_read_fallback', {
          notification_uuid: notifications[0].id,
          user_uuid: 'f2b73849-b65e-4e0c-a2ec-2c3ba03ccfa4'
        });

      if (markError) {
        console.error('❌ mark_notification_read_fallback function failed:', markError);
        console.log('🔧 This function also doesn\'t exist in Supabase!');
      } else {
        console.log('✅ mark_notification_read_fallback works!');
        console.log('✅ Mark result:', markResult);
      }
    }

    console.log('');

    // Test 3: Direct query test (bypass RPC)
    console.log('🔍 TEST 3: Testing direct query (bypass RPC)...');
    
    const { data: directNotifications, error: directError } = await supabase
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
        created_at,
        sender:users(name)
      `)
      .eq('recipient_id', 'f2b73849-b65e-4e0c-a2ec-2c3ba03ccfa4')
      .order('created_at', { ascending: false })
      .limit(10);

    if (directError) {
      console.error('❌ Direct query also failed:', directError);
      console.error('This indicates RLS policy issues!');
    } else {
      console.log('✅ Direct query works!');
      console.log(`✅ Found ${directNotifications?.length || 0} notifications directly`);
      
      directNotifications?.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.type} - ${notif.title}`);
        console.log(`     Recipient: f2b73849-b65e-4e0c-a2ec-2c3ba03ccfa4`);
        console.log(`     WhatsApp: ${notif.related_user_phone || 'None'}`);
        console.log('');
      });
    }

    console.log('');

    // Test 4: Create a test notification manually
    console.log('🔍 TEST 4: Creating test notification manually...');
    
    const testNotification = {
      recipient_id: 'f2b73849-b65e-4e0c-a2ec-2c3ba03ccfa4',
      sender_id: '00000000-0000-0000-0000-000000000001',
      type: 'join_accepted',
      title: 'Test Accept Notification',
      message: 'Test: Your request was accepted! Tap to contact rider.',
      announcement_id: 'test-announcement-id',
      status: 'accepted',
      related_user_phone: '+1234567890'
    };

    const { data: createdNotification, error: createError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create test notification:', createError);
      console.error('Error details:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code
      });
    } else {
      console.log('✅ Test notification created successfully!');
      console.log('✅ Notification ID:', createdNotification.id);
      
      // Clean up
      await supabase.from('notifications').delete().eq('id', createdNotification.id);
      console.log('🧹 Test notification cleaned up');
    }

    console.log('');
    console.log('🎯 DIAGNOSIS COMPLETE!');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. If RPC functions failed → Deploy fix-notification-errors.sql to Supabase');
    console.log('2. If direct query failed → Fix RLS policies');
    console.log('3. If create failed → Check database permissions');
    console.log('4. If all passed → Check frontend API calls');
    console.log('');
    console.log('🚀 The issue is likely that database functions are not deployed to Supabase!');

  } catch (error) {
    console.error('💥 Function test failed:', error);
  }
}

// Run the test
console.log('🚀 Starting Database Function Existence Test');
console.log('');

testFunctionExists();
