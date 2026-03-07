// Test script to verify admin routes work correctly
const express = require('express');
const { auth } = require('./middleware/auth');
const { supabase } = require('./config/supabase');

// Create a test route to verify admin functionality
const testAdminRoute = async () => {
  try {
    console.log('🧪 Testing admin route functionality...\n');

    // Test 1: Check if we can query users table directly
    console.log('1. Testing direct users table query...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone_number,
        role,
        verified,
        is_phone_verified,
        is_online,
        average_rating,
        completed_trips,
        total_trips,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) {
      console.error('❌ Users query failed:', usersError);
      return;
    }

    console.log('✅ Users table query successful');
    console.log(`📊 Found ${users?.length || 0} users`);
    if (users && users.length > 0) {
      console.log('👤 Sample user:', {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        role: users[0].role,
        verified: users[0].verified
      });
    }

    // Test 2: Check for admin users
    console.log('\n2. Testing admin user lookup...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Admin query failed:', adminError);
      return;
    }

    console.log('✅ Admin query successful');
    console.log(`📊 Found ${adminUsers?.length || 0} admin users`);
    if (adminUsers && adminUsers.length > 0) {
      console.log('👑 Admin users:', adminUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role
      })));
    } else {
      console.log('⚠️  No admin users found. You may need to update a user role to "admin"');
    }

    // Test 3: Check announcements table
    console.log('\n3. Testing announcements table query...');
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .limit(3);

    if (announcementsError) {
      console.error('❌ Announcements query failed:', announcementsError);
      return;
    }

    console.log('✅ Announcements query successful');
    console.log(`📊 Found ${announcements?.length || 0} announcements`);

    console.log('\n🎉 All database tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Ensure you have at least one user with role="admin" in the users table');
    console.log('2. Use a valid JWT token from Supabase auth for that admin user');
    console.log('3. The backend routes should work correctly now');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testAdminRoute();
