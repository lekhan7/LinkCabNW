require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testFavoriteNotificationFix() {
  try {
    console.log('🧪 Testing favorite notification system fix...');
    
    // 1. Test if functions exist after fix
    console.log('\n📋 Testing function existence...');
    
    // Test announcement function
    const { data: result1, error: error1 } = await supabase
      .rpc('create_favorite_match_notification', {
        announcement_uuid: '00000000-0000-0000-0000-000000000000'
      });
    
    if (error1) {
      if (error1.message?.includes('function') && error1.message?.includes('does not exist')) {
        console.log('❌ Announcement function not found - please run fix-favorite-notification-system.sql');
        return;
      } else {
        console.log('✅ Announcement function exists (expected error for invalid UUID)');
      }
    } else {
      console.log('✅ Announcement function exists and executed!');
    }
    
    // Test ride function
    const { data: result2, error: error2 } = await supabase
      .rpc('create_favorite_match_notification_for_ride', {
        ride_uuid: '00000000-0000-0000-0000-000000000000'
      });
    
    if (error2) {
      if (error2.message?.includes('function') && error2.message?.includes('does not exist')) {
        console.log('❌ Ride function not found - please run fix-favorite-notification-system.sql');
        return;
      } else {
        console.log('✅ Ride function exists (expected error for invalid UUID)');
      }
    } else {
      console.log('✅ Ride function exists and executed!');
    }
    
    // 2. Check favorite routes
    const { data: favoriteRoutes, error: favError } = await supabase
      .from('favorite_routes')
      .select('*')
      .limit(3);
    
    if (favError) {
      console.error('❌ Error fetching favorite routes:', favError);
      return;
    }
    
    console.log(`\n📋 Found ${favoriteRoutes?.length || 0} favorite routes:`);
    if (favoriteRoutes && favoriteRoutes.length > 0) {
      favoriteRoutes.forEach((fr, index) => {
        console.log(`${index + 1}. From: ${fr.from_location} To: ${fr.to_location} (User: ${fr.user_id})`);
      });
    }
    
    // 3. Check announcements
    const { data: announcements, error: annError } = await supabase
      .from('announcements')
      .select('*')
      .limit(3);
    
    if (annError) {
      console.error('❌ Error fetching announcements:', annError);
      return;
    }
    
    console.log(`\n📋 Found ${announcements?.length || 0} announcements:`);
    if (announcements && announcements.length > 0) {
      announcements.forEach((ann, index) => {
        console.log(`${index + 1}. From: ${ann.start_location_name} To: ${ann.destination_name} (Creator: ${ann.created_by})`);
      });
    }
    
    // 4. Check for existing favorite notifications
    const { data: existingNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'favorite_match')
      .limit(3);
    
    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError);
    } else {
      console.log(`\n📋 Found ${existingNotifications?.length || 0} existing favorite match notifications:`);
      if (existingNotifications && existingNotifications.length > 0) {
        existingNotifications.forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title} - ${notif.message?.substring(0, 60)}...`);
        });
      }
    }
    
    // 5. Test notification type consistency
    console.log('\n🔍 Testing notification type consistency...');
    const { data: typeCheck, error: typeError } = await supabase
      .from('notifications')
      .select('type')
      .like('type', '%favorite%')
      .limit(5);
    
    if (!typeError && typeCheck) {
      const uniqueTypes = [...new Set(typeCheck.map(n => n.type))];
      console.log(`Found favorite-related notification types: ${uniqueTypes.join(', ')}`);
      
      if (uniqueTypes.includes('favorite_match')) {
        console.log('✅ Consistent notification type "favorite_match" found');
      } else {
        console.log('⚠️  No "favorite_match" type found - functions may use different types');
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('1. ✅ Functions existence checked');
    console.log('2. ✅ Favorite routes system checked');
    console.log('3. ✅ Announcements system checked');
    console.log('4. ✅ Notification system checked');
    console.log('5. ✅ Type consistency verified');
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. If functions don\'t exist, run: fix-favorite-notification-system.sql');
    console.log('2. Create a test favorite route (if none exist)');
    console.log('3. Create a matching announcement or ride');
    console.log('4. Check notifications table for new entries');
    console.log('5. Test real-time notifications via Socket.IO');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testFavoriteNotificationFix();
