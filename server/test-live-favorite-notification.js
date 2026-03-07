require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testLiveFavoriteNotification() {
  try {
    console.log('🧪 Testing LIVE favorite notification creation...');
    
    // 1. Get a real user and favorite route
    const { data: favoriteRoutes, error: favError } = await supabase
      .from('favorite_routes')
      .select('*')
      .limit(1);
    
    if (favError || !favoriteRoutes || favoriteRoutes.length === 0) {
      console.log('❌ No favorite routes found');
      return;
    }
    
    const favRoute = favoriteRoutes[0];
    console.log(`📍 Using favorite route: From "${favRoute.from_location}" To "${favRoute.to_location}" (User: ${favRoute.user_id})`);
    
    // 2. Get a different user to create a ride
    const { data: otherUsers, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .neq('id', favRoute.user_id)
      .limit(1);
    
    if (userError || !otherUsers || otherUsers.length === 0) {
      console.log('❌ No other users found to create ride');
      return;
    }
    
    const creator = otherUsers[0];
    console.log(`👤 Creator: ${creator.name} (${creator.id})`);
    
    // 3. Create a test ride that matches the favorite route
    const rideData = {
      user_id: creator.id,
      source_name: favRoute.from_location,
      destination_name: favRoute.to_location,
      source_lat: 15.2993,
      source_lng: 74.1240,
      destination_lat: 12.4244,
      destination_lng: 75.7394,
      date: new Date().toISOString().split('T')[0], // Today
      time: '10:00',
      travel_mode: 'car',
      status: 'booked',
      type: 'SELF_BOOKED',
      is_shared: false,
      estimated_cost: 300,
      notes: 'Test ride for favorite notifications'
    };
    
    console.log('🚗 Creating test ride...');
    const { data: newRide, error: rideError } = await supabase
      .from('rides')
      .insert(rideData)
      .select()
      .single();
    
    if (rideError) {
      console.error('❌ Error creating ride:', rideError);
      return;
    }
    
    console.log(`✅ Ride created: ${newRide.id}`);
    
    // 4. Manually trigger the notification function
    console.log('🔔 Triggering favorite notification function...');
    const { data: notifResult, error: notifError } = await supabase
      .rpc('create_favorite_match_notification_for_ride', { 
        ride_uuid: newRide.id 
      });
    
    if (notifError) {
      console.error('❌ Notification function error:', notifError);
      
      // Check if it's a data issue
      if (notifError.message?.includes('no matching favorite routes')) {
        console.log('⚠️  No matching favorite routes found - checking route matching logic...');
        
        // Debug the matching logic
        const { data: debugMatch, error: debugError } = await supabase
          .from('favorite_routes')
          .select('*')
          .or(`from_location.ilike.%${favRoute.from_location}%,to_location.ilike.%${favRoute.to_location}%`)
          .or(`from_location.ilike.%${favRoute.to_location}%,to_location.ilike.%${favRoute.from_location}%`);
        
        if (debugError) {
          console.error('Debug query error:', debugError);
        } else {
          console.log(`🔍 Debug: Found ${debugMatch?.length || 0} potential matches`);
        }
      }
    } else {
      console.log('✅ Notification function executed successfully!');
    }
    
    // 5. Check if notifications were created
    console.log('📋 Checking for created notifications...');
    const { data: notifications, error: checkError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'FAVORITE_ROUTE_MATCH')
      .eq('related_announcement_id', newRide.id)
      .eq('recipient_id', favRoute.user_id);
    
    if (checkError) {
      console.error('❌ Error checking notifications:', checkError);
    } else {
      console.log(`📧 Found ${notifications?.length || 0} notifications for the favorite user`);
      
      if (notifications && notifications.length > 0) {
        notifications.forEach((notif, index) => {
          console.log(`${index + 1}. Title: "${notif.title}"`);
          console.log(`   Message: "${notif.message}"`);
          console.log(`   Recipient: ${notif.recipient_id}`);
          console.log(`   Created: ${notif.created_at}`);
        });
      }
    }
    
    // 6. Check all favorite notifications
    const { data: allNotifs, error: allError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'FAVORITE_ROUTE_MATCH')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!allError && allNotifs) {
      console.log(`\n📊 Total favorite_match notifications: ${allNotifs.length}`);
      allNotifs.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title} - ${notif.message?.substring(0, 50)}...`);
      });
    }
    
    // 7. Clean up test ride
    console.log('\n🧹 Cleaning up test ride...');
    const { error: deleteError } = await supabase
      .from('rides')
      .delete()
      .eq('id', newRide.id);
    
    if (deleteError) {
      console.error('❌ Error cleaning up ride:', deleteError);
    } else {
      console.log('✅ Test ride cleaned up');
    }
    
    console.log('\n🎯 TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testLiveFavoriteNotification();
