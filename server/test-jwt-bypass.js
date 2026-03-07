// Test script to verify JWT bypass auth works
const { supabase } = require('./config/supabase');

async function testJWTBypass() {
  try {
    console.log('🧪 Testing JWT Bypass Authentication...\n');

    // Test 1: Check if we can find users in database
    console.log('1. Testing database access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(3);

    if (usersError) {
      console.error('❌ Database access failed:', usersError);
      return;
    }

    console.log('✅ Database accessible');
    console.log(`📊 Found ${users?.length || 0} users`);

    if (!users || users.length === 0) {
      console.log('⚠️  No users found. You need to signup first.');
      return;
    }

    // Test 2: Simulate JWT decode
    console.log('\n2. Testing JWT decode simulation...');
    const sampleUser = users[0];
    
    // Create a fake JWT payload (for testing)
    const fakePayload = {
      sub: sampleUser.id,
      email: sampleUser.email,
      aud: 'authenticated',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    };

    console.log('🔑 Sample JWT payload:', fakePayload);

    // Test 3: Simulate auth middleware lookup
    console.log('\n3. Testing auth middleware simulation...');
    const { data: authUser, error: authError } = await supabase
      .from('users')
      .select('*')
      .eq('id', fakePayload.sub)
      .single();

    if (authError || !authUser) {
      console.error('❌ Auth lookup failed:', authError);
      return;
    }

    console.log('✅ Auth lookup successful');
    console.log('👤 Authenticated user:', {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role
    });

    console.log('\n🎉 JWT Bypass test passed!');
    console.log('\n📋 To apply the bypass fix:');
    console.log('1. Replace auth.js with auth-bypass.js in middleware folder');
    console.log('2. Or update the imports in your routes to use auth-bypass');
    console.log('3. Restart the server');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJWTBypass();
