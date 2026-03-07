require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testFavoriteNotifications() {
  try {
    console.log('🧪 Testing favorite notification system...');
    
    // 1. Check if favorite routes exist
    const { data: favoriteRoutes, error: favError } = await supabase
      .from('favorite_routes')
      .select('*')
      .limit(5);
    
    if (favError) {
      console.error('❌ Error fetching favorite routes:', favError);
      return;
    }
    
    console.log(`📋 Found ${favoriteRoutes?.length || 0} favorite routes`);
    
    if (favoriteRoutes && favoriteRoutes.length > 0) {
      favoriteRoutes.forEach((fr, index) => {
        console.log(`${index + 1}. From: ${fr.from_location} To: ${fr.to_location} (User: ${fr.user_id})`);
      });
    }
    
    // 2. Check if announcements exist
    const { data: announcements, error: annError } = await supabase
      .from('announcements')
      .select('*')
      .limit(5);
    
    if (annError) {
      console.error('❌ Error fetching announcements:', annError);
      return;
    }
    
    console.log(`📋 Found ${announcements?.length || 0} announcements`);
    
    if (announcements && announcements.length > 0) {
      announcements.forEach((ann, index) => {
        console.log(`${index + 1}. From: ${ann.start_location_name} To: ${ann.destination_name} (Creator: ${ann.created_by})`);
      });
    }
    
    // 3. Test if the function exists (after deployment)
    console.log('\n🧪 Testing function existence...');
    const { data: result, error: funcError } = await supabase
      .rpc('create_favorite_match_notification', {
        announcement_uuid: '00000000-0000-0000-0000-000000000000'
      });
    
    if (funcError) {
      if (funcError.message?.includes('function') && funcError.message?.includes('does not exist')) {
        console.log('⚠️  Function not deployed yet. Please run the SQL first.');
      } else {
        console.log('✅ Function exists! Error is expected (invalid UUID):', funcError.message?.substring(0, 100) + '...');
      }
    } else {
      console.log('✅ Function exists and executed successfully!');
    }
    
    // 4. Check for existing favorite match notifications
    const { data: existingNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'FAVORITE_ROUTE_MATCH')
      .limit(5);
    
    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError);
    } else {
      console.log(`📋 Found ${existingNotifications?.length || 0} existing favorite match notifications`);
      
      if (existingNotifications && existingNotifications.length > 0) {
        existingNotifications.forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title} - ${notif.message?.substring(0, 80)}...`);
        });
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('1. ✅ Favorite routes system checked');
    console.log('2. ✅ Announcements system checked');
    console.log('3. ⚠️  Function deployment needed');
    console.log('4. ✅ Notification system checked');
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Run the SQL script in Supabase SQL Editor');
    console.log('2. Create a test favorite route');
    console.log('3. Create a matching announcement');
    console.log('4. Check if notification is received');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testFavoriteNotifications();
