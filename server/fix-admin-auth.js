#!/usr/bin/env node

const { supabase } = require('./config/supabase');
const jwt = require('jsonwebtoken');

async function fixAdminAuth() {
  console.log('🔧 Admin Feedback API Fix Tool\n');
  console.log('This tool will help diagnose and fix the admin auth issue.\n');

  // Step 1: Check database connection
  console.log('📊 Step 1: Checking database connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    console.log('✅ Database connection successful');
  } catch (err) {
    console.error('❌ Database error:', err.message);
    return;
  }

  // Step 2: Check admin users
  console.log('\n👤 Step 2: Checking admin users...');
  try {
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('id, email, role, name')
      .eq('role', 'admin');
    
    if (error) {
      console.error('❌ Error fetching admin users:', error.message);
    } else {
      console.log(`✅ Found ${adminUsers?.length || 0} admin users:`);
      if (adminUsers?.length > 0) {
        adminUsers.forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
      } else {
        console.log('   ⚠️  No admin users found!');
      }
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }

  // Step 3: Check all users
  console.log('\n👥 Step 3: Checking all users...');
  try {
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, email, role, name')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
    } else {
      console.log('✅ Latest users:');
      allUsers.forEach(user => {
        const isAdmin = user.role === 'admin' ? '👑' : '👤';
        console.log(`   ${isAdmin} ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }

  // Step 4: Check reviews table
  console.log('\n💬 Step 4: Checking reviews table...');
  try {
    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error accessing reviews table:', error.message);
    } else {
      console.log(`✅ Reviews table accessible - Total reviews: ${count || 0}`);
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }

  // Step 5: Generate SQL commands
  console.log('\n🔧 Step 5: SQL Commands to fix issues...');
  console.log('If you need to make a user an admin, run one of these SQL commands:');
  console.log('\n-- Option 1: Update by email');
  console.log("UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';");
  console.log('\n-- Option 2: Update by name');
  console.log("UPDATE users SET role = 'admin' WHERE name = 'Admin Name';");
  console.log('\n-- Option 3: Update specific user ID');
  console.log("UPDATE users SET role = 'admin' WHERE id = 'user-uuid-here';");
  
  console.log('\n📝 Step 6: How to test the fix...');
  console.log('1. Update your user role to admin using the SQL commands above');
  console.log('2. Restart your server');
  console.log('3. Log out and log back in to get a fresh JWT token');
  console.log('4. Try accessing the Admin Feedback page');
  console.log('\nDebug endpoints you can use:');
  console.log('- GET /api/debug/check-role - Check your current role');
  console.log('- GET /api/debug/list-users - List all users (admin only)');
  
  console.log('\n🎯 Expected result after fix:');
  console.log('- Admin Feedback page should load without 403 error');
  console.log('- Server logs should show "✅ AdminAuth passed: user@email.com is admin"');
  console.log('- Feedback data should be displayed in the admin interface');
  
  console.log('\n✨ Fix complete! Run the SQL commands if needed and test again.');
}

fixAdminAuth().catch(console.error);
