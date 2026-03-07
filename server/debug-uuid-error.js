require('dotenv').config();
const { supabase } = require('./config/supabase');

async function debugUUIDError() {
  try {
    console.log('🔍 Debugging UUID error...');
    
    // First, let's find a real notification to test with
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
    
    // Test the stored procedure call
    console.log('\n🧪 Testing update_participant_status...');
    const { data: result, error: updateError } = await supabase
      .rpc('update_participant_status', {
        p_participant_id: notification.request_id,
        p_new_status: 'accepted',
        p_current_user_id: notification.recipient_id
      });
    
    if (updateError) {
      console.error('❌ Stored procedure error:', updateError);
      return;
    }
    
    console.log('✅ Stored procedure result:', result);
    
    // Now test creating the notification
    if (result?.participant_updated?.user_id) {
      console.log('\n🧪 Testing notification creation...');
      
      const passengerUserId = result.participant_updated.user_id;
      console.log('🔍 passengerUserId:', passengerUserId);
      console.log('🔍 notification.announcement_id:', notification.announcement_id);
      console.log('🔍 notification.request_id:', notification.request_id);
      
      const notificationData = {
        recipient_id: passengerUserId,
        sender_id: notification.recipient_id,
        type: 'join_accepted',
        title: 'Join Request Accepted! 🎉',
        message: 'Your ride request has been accepted! Contact the driver on WhatsApp to coordinate details.',
        announcement_id: notification.announcement_id,
        request_id: notification.request_id,
        related_user_phone: result.participant_updated?.phone_number || null,
        status: 'accepted',
        is_read: false
      };
      
      console.log('🔍 notificationData:', notificationData);
      
      // Validate UUIDs before inserting
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      console.log('\n🔍 Validating UUIDs:');
      console.log('recipient_id valid:', uuidRegex.test(notificationData.recipient_id));
      console.log('sender_id valid:', uuidRegex.test(notificationData.sender_id));
      console.log('announcement_id valid:', uuidRegex.test(notificationData.announcement_id));
      console.log('request_id valid:', uuidRegex.test(notificationData.request_id));
      
      const { data: newNotification, error: newNotifError } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();
      
      if (newNotifError) {
        console.error('❌ Notification creation error:', newNotifError);
        console.error('Error details:', {
          message: newNotifError.message,
          details: newNotifError.details,
          hint: newNotifError.hint,
          code: newNotifError.code
        });
      } else {
        console.log('✅ Notification created successfully:', newNotification);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

debugUUIDError();
