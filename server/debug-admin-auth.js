const { supabase } = require('./config/supabase');
const jwt = require('jsonwebtoken');

async function debugAuthFlow() {
  console.log('=== Debugging Admin Auth Flow ===\n');
  
  // Test 1: Check if admin users exist
  console.log('1. Checking for admin users...');
  try {
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, role, name')
      .eq('role', 'admin');
    
    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
    } else {
      console.log(`✅ Found ${adminUsers?.length || 0} admin users:`);
      adminUsers?.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
      });
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
  
  // Test 2: Check all users to see roles
  console.log('\n2. Checking all users and their roles...');
  try {
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, email, role, name')
      .limit(5);
    
    if (allError) {
      console.error('❌ Error fetching users:', allError);
    } else {
      console.log(`✅ Sample users:`);
      allUsers?.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
      });
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
  
  // Test 3: Check the reviews/feedback table structure
  console.log('\n3. Checking reviews table structure...');
  try {
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .limit(1);
    
    if (reviewsError) {
      console.error('❌ Error accessing reviews table:', reviewsError);
    } else {
      console.log('✅ Reviews table accessible. Sample columns:', Object.keys(reviews[0] || {}));
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
  
  console.log('\n=== SQL Commands to Fix Issues ===');
  console.log('-- To make a user an admin, run:');
  console.log("UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';");
  console.log('\n-- To check if a user is admin:');
  console.log("SELECT id, email, role, name FROM users WHERE email = 'your-admin-email@example.com';");
  
  process.exit(0);
}

debugAuthFlow();
