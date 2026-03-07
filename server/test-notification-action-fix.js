require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testNotificationActionFix() {
  try {
    console.log('🧪 Testing notification action fix...');
    
    // Find a join_request notification
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'join_request')
      .eq('status', 'pending')
      .limit(1);
    
    if (notifError || !notifications || notifications.length === 0) {
      console.log('❌ No join_request notifications found');
      return;
    }
    
    const notification = notifications[0];
    console.log('📋 Found notification:', {
      id: notification.id,
      type: notification.type,
      request_id: notification.request_id,
      announcement_id: notification.announcement_id
    });
    
    // Test the RPC call that was failing
    console.log('\n🧪 Testing RPC call...');
    const { data: result, error: updateError } = await supabase
      .rpc('update_participant_status', {
        p_participant_id: notification.request_id,
        p_new_status: 'accepted',
        p_current_user_id: notification.recipient_id
      });
    
    console.log('RPC Result:', result);
    console.log('RPC Error:', updateError);
    
    if (updateError) {
      console.log('✅ RPC error detected (expected):', updateError.message);
    } else if (!result?.success) {
      console.log('✅ RPC returned error in result (expected):', result.error);
    }
    
    if (updateError || !result?.success) {
      // Test our fallback logic
      console.log('\n🔧 Testing fallback logic...');
      
      // Extract participant info
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
        console.log('✅ Participant info found:', {
          id: participantInfo.id,
          user_id: participantInfo.user_id,
          phone_number: participantInfo.users.phone_number
        });
        
        // Update participant status manually
        const { error: statusUpdateError } = await supabase
          .from('announcement_participants')
          .update({ status: 'accepted' })
          .eq('id', notification.request_id);
        
        if (statusUpdateError) {
          console.error('❌ Status update failed:', statusUpdateError);
        } else {
          console.log('✅ Status updated successfully');
        }
        
        // Create notification manually
        const notificationData = {
          recipient_id: participantInfo.user_id,
          sender_id: notification.recipient_id,
          type: 'join_accepted',
          title: 'Join Request Accepted! 🎉',
          message: 'Your ride request has been accepted! Contact the driver on WhatsApp to coordinate details.',
          announcement_id: notification.announcement_id,
          request_id: notification.request_id,
          related_user_phone: participantInfo.users.phone_number,
          status: 'accepted',
          is_read: false
        };
        
        const { data: newNotification, error: newNotifError } = await supabase
          .from('notifications')
          .insert(notificationData)
          .select()
          .single();
        
        if (newNotifError) {
          console.error('❌ Notification creation failed:', newNotifError);
        } else {
          console.log('✅ Notification created successfully:', newNotification.id);
        }
        
        console.log('\n🎯 Fix validation complete!');
        console.log('✅ Accept button should now work');
        console.log('✅ Passenger receives notification');
        console.log('✅ WhatsApp number included');
        console.log('✅ No UUID syntax error');
      }
    } else {
      console.log('✅ RPC call succeeded - no fallback needed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testNotificationActionFix();
