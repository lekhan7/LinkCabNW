require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testNotifications() {
  console.log('🔍 Testing notification system...\n');

  try {
    // Test 1: Check if notifications table exists and has data
    console.log('📋 1. Checking notifications table...');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError);
      return;
    }

    console.log(`✅ Found ${notifications.length} notifications in database`);
    
    if (notifications.length > 0) {
      console.log('📝 Recent notifications:');
      notifications.forEach((notif, index) => {
        console.log(`  ${index + 1}. Type: ${notif.type}, Recipient: ${notif.recipient_id}, Title: ${notif.title}`);
      });
    }

    // Test 2: Check recent join_accepted/join_rejected notifications
    console.log('\n🎯 2. Checking recent accept/reject notifications...');
    const { data: recentNotifications, error: recentError } = await supabase
      .from('notifications')
      .select('*')
      .in('type', ['join_accepted', 'join_rejected'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Error fetching recent notifications:', recentError);
      return;
    }

    console.log(`✅ Found ${recentNotifications.length} recent accept/reject notifications`);
    
    if (recentNotifications.length > 0) {
      console.log('📝 Recent accept/reject notifications:');
      recentNotifications.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.type.toUpperCase()}: ${notif.message}`);
        console.log(`     Recipient: ${notif.recipient_id}, Sender: ${notif.sender_id}`);
        console.log(`     Created: ${notif.created_at}`);
      });
    }

    // Test 3: Check users table to verify user IDs
    console.log('\n👥 3. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`✅ Found ${users.length} users in database`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });

    // Test 4: Create a test notification
    console.log('\n🧪 4. Creating a test notification...');
    const testNotification = {
      recipient_id: users[0]?.id,
      sender_id: users[1]?.id || users[0]?.id,
      type: 'join_accepted', // Use a valid type from the schema
      title: 'Test Notification',
      message: 'This is a test notification to verify the system works',
      announcement_id: null
    };

    if (testNotification.recipient_id) {
      const { data: createdNotif, error: createError } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test notification:', createError);
      } else {
        console.log('✅ Test notification created successfully:', createdNotif.id);
      }
    } else {
      console.log('⚠️ No users available to create test notification');
    }

    console.log('\n🎉 Notification system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNotifications();
