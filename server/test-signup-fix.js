// Test script to verify user signup RLS fix
const { supabase } = require('./config/supabase');

async function testUserSignupFix() {
  try {
    console.log('🧪 Testing User Signup RLS Fix...\n');

    // Test 1: Check if we can query users table
    console.log('1. Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(1);

    if (usersError) {
      console.error('❌ Users table access failed:', usersError);
      if (usersError.code === '42501') {
        console.log('🔒 RLS policy still blocking access');
      }
      return;
    }

    console.log('✅ Users table accessible');
    console.log(`📊 Found ${users?.length || 0} users`);

    // Test 2: Check RLS status
    console.log('\n2. Checking RLS status...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status'); // This would need to be created
    
    // Alternative: Try to insert a test user
    console.log('\n3. Testing user insertion (simulating signup)...');
    const testUser = {
      id: 'test-signup-' + Date.now(),
      name: 'Test Signup User',
      email: `test${Date.now()}@example.com`,
      phone_number: '1234567890',
      password: 'test123',
      role: 'user',
      verified: false,
      created_at: new Date().toISOString()
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (insertError) {
      console.error('❌ User insertion failed:', insertError);
      if (insertError.code === '42501') {
        console.log('🔒 RLS policy still blocking insertion');
        console.log('📝 You need to run the disable-users-rls.sql script in Supabase SQL Editor');
      }
      return;
    }

    console.log('✅ User insertion successful');
    console.log('👤 Created test user:', {
      id: insertResult.id,
      name: insertResult.name,
      email: insertResult.email
    });

    // Clean up test user
    console.log('\n4. Cleaning up test user...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id);

    if (deleteError) {
      console.error('⚠️  Failed to clean up test user:', deleteError);
    } else {
      console.log('✅ Test user cleaned up');
    }

    console.log('\n🎉 All tests passed! User signup should work now.');
    console.log('\n📋 If tests failed, run this in Supabase SQL Editor:');
    console.log('   -- Copy and paste the contents of disable-users-rls.sql');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserSignupFix();
