require('dotenv').config();
const { supabase } = require('./config/supabase');

async function createTestNotification() {
  try {
    console.log('🔍 Creating test notification...');
    
    // First, let's create a test notification directly
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: '00000000-0000-0000-0000-000000000001', // Dummy recipient
        sender_id: '00000000-0000-0000-0000-000000000002', // Dummy sender
        type: 'join_request',
        title: 'Test Join Request',
        message: 'John Doe wants to join your ride from New York to Los Angeles!',
        announcement_id: null,
        request_id: null,
        related_user_phone: '+1234567890',
        status: 'pending',
        is_read: false
      })
      .select()
      .single();
    
    console.log('Created notification:', { notificationData, notificationError });
    
    // Now test the get_user_notifications function
    const { data: notifications, error: fetchError } = await supabase.rpc('get_user_notifications', {
      p_user_id: '00000000-0000-0000-0000-000000000001',
      p_limit: 5
    });
    
    console.log('Fetched notifications:', { notifications, fetchError });
    
  } catch (err) {
    console.error('Test error:', err);
  }
}

createTestNotification();
