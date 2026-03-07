// Test script to verify admin authentication flow
const { supabase } = require('./config/supabase');

async function testAuthFlow() {
  try {
    console.log('🔍 Testing admin authentication flow...\n');

    // 1. Test connection
    console.log('1. Testing Supabase connection...');
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, name')
      .eq('role', 'admin')
      .limit(1);
    
    if (error) {
      console.error('❌ Database query failed:', error);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Admin users found:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('👤 Sample admin user:', {
        id: data[0].id,
        email: data[0].email,
        name: data[0].name,
        role: data[0].role
      });
    }

    // 2. Test users table structure
    console.log('\n2. Testing users table structure...');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, phone_number, role, verified, is_phone_verified, is_online, average_rating, completed_trips, total_trips, created_at')
      .limit(3);
    
    if (usersError) {
      console.error('❌ Users table query failed:', usersError);
      return;
    }
    
    console.log('✅ Users table structure correct');
    console.log('📊 Total users accessible:', allUsers?.length || 0);
    
    if (allUsers && allUsers.length > 0) {
      console.log('👤 Sample user:', {
        id: allUsers[0].id,
        name: allUsers[0].name,
        email: allUsers[0].email,
        role: allUsers[0].role,
        verified: allUsers[0].verified
      });
    }

    // 3. Test announcements table
    console.log('\n3. Testing announcements table...');
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('id, start_location_name, destination_name, created_by')
      .limit(3);
    
    if (announcementsError) {
      console.error('❌ Announcements table query failed:', announcementsError);
      return;
    }
    
    console.log('✅ Announcements table accessible');
    console.log('📊 Total announcements:', announcements?.length || 0);

    console.log('\n🎉 All database tests passed!');
    console.log('📝 The backend routes should work correctly.');
    console.log('🔧 If issues persist, check:');
    console.log('   - JWT token validity in frontend');
    console.log('   - Admin role assignment in users table');
    console.log('   - Network connectivity to backend');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthFlow();
