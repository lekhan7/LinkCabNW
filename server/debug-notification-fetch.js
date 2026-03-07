// ============================================
// 🔧 DEBUG: Why Co-Passenger Not Getting Notifications
// ============================================

const { supabase } = require('./config/supabase');

async function debugNotificationFetch() {
  console.log('🔍 DEBUGGING: Co-Passenger Notification Fetch Issue\n');

  try {
    // Test 1: Check ALL notifications in database
    console.log('🔍 TEST 1: Checking ALL notifications in database...');
    
    const { data: allNotifications, error: allError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (allError) {
      console.error('❌ Failed to fetch all notifications:', allError);
    } else {
      console.log(`✅ Found ${allNotifications?.length || 0} total notifications in database`);
      
      allNotifications?.forEach((notif, index) => {
        console.log(`  ${index + 1}. ID: ${notif.id}`);
        console.log(`     Type: ${notif.type}`);
        console.log(`     Recipient: ${notif.recipient_id}`);
        console.log(`     Sender: ${notif.sender_id}`);
        console.log(`     Message: ${notif.message}`);
        console.log(`     Status: ${notif.status}`);
        console.log(`     Is Read: ${notif.is_read}`);
        console.log(`     WhatsApp: ${notif.related_user_phone || 'None'}`);
        console.log(`     Created: ${notif.created_at}`);
        console.log('');
      });
    }

    console.log('');

    // Test 2: Check specifically for co-passenger notifications
    console.log('🔍 TEST 2: Checking co-passenger notifications...');
    
    const coPassengerId = 'f2b73849-b65e-4e0c-a2ec-2c3ba03ccfa4'; // From your logs
    
    const { data: coPassengerNotifications, error: coPassengerError } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', coPassengerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (coPassengerError) {
      console.error('❌ Failed to fetch co-passenger notifications:', coPassengerError);
      console.error('Error details:', {
        message: coPassengerError.message,
        details: coPassengerError.details,
        hint: coPassengerError.hint,
        code: coPassengerError.code
      });
    } else {
      console.log(`✅ Found ${coPassengerNotifications?.length || 0} notifications for co-passenger ${coPassengerId}`);
      
      coPassengerNotifications?.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.type} - ${notif.title}`);
        console.log(`     Message: ${notif.message}`);
        console.log(`     Created: ${notif.created_at}`);
        console.log(`     Is Read: ${notif.is_read}`);
        console.log('');
      });
    }

    console.log('');

    // Test 3: Test the API endpoint directly
    console.log('🔍 TEST 3: Testing notifications API endpoint...');
    
    try {
      const apiResponse = await fetch(`http://localhost:5000/api/notifications?limit=10&offset=0&unreadOnly=false`, {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
        }
      });

      console.log('📡 API Response Status:', apiResponse.status);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('✅ API Response:', JSON.stringify(apiData, null, 2));
        
        if (apiData.success && apiData.data) {
          console.log(`✅ API returned ${apiData.data.length} notifications`);
          
          apiData.data.forEach((notif, index) => {
            console.log(`  ${index + 1}. ${notif.type} - ${notif.title}`);
            console.log(`     Message: ${notif.message}`);
            console.log(`     WhatsApp URL: ${notif.whatsapp_url || 'None'}`);
            console.log('');
          });
        }
      } else {
        console.error('❌ API request failed:', await apiResponse.text());
      }
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
    }

    console.log('');

    // Test 4: Check RLS policies are working
    console.log('🔍 TEST 4: Checking if RLS is blocking access...');
    
    // Try to insert a test notification as co-passenger
    const testNotification = {
      recipient_id: coPassengerId,
      sender_id: '00000000-0000-0000-0000-000000000001',
      type: 'test_notification',
      title: 'Test Notification',
      message: 'This is a test to check RLS',
      status: 'pending'
    };

    const { data: testInsert, error: testError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (testError) {
      console.error('❌ RLS might be blocking insert:', testError);
      console.error('Error details:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
    } else {
      console.log('✅ Test notification inserted successfully:', testInsert.id);
      
      // Clean up test notification
      await supabase.from('notifications').delete().eq('id', testInsert.id);
      console.log('🧹 Test notification cleaned up');
    }

    console.log('');

    // Test 5: Check if notifications API is using the right query
    console.log('🔍 TEST 5: Checking notifications API implementation...');
    
    console.log('📋 Expected API behavior:');
    console.log('  1. Should call get_user_notifications_fallback RPC');
    console.log('  2. Should filter by recipient_id = auth.uid()');
    console.log('  3. Should return notifications with whatsapp_url for join_accepted');
    console.log('  4. Should handle RLS properly');
    console.log('');

    console.log('🎯 MOST LIKELY ISSUES:');
    console.log('  1. RLS policies blocking SELECT for co-passenger');
    console.log('  2. API endpoint using wrong user ID');
    console.log('  3. Frontend not calling API correctly');
    console.log('  4. Notifications created with wrong recipient_id');
    console.log('  5. JWT token authentication issues');

  } catch (error) {
    console.error('💥 Debug test failed:', error);
  }
}

// Run the debug
console.log('🚀 Starting Co-Passenger Notification Debug');
console.log('⚠️  Replace JWT token with actual token from browser');
console.log('');

debugNotificationFetch();
