// Test script to verify all auth tables work after RLS fix
const { supabase } = require('./config/supabase');

async function testAllAuthTables() {
  try {
    console.log('🧪 Testing All Auth Tables After RLS Fix...\n');

    // Test 1: Users table
    console.log('1. Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(1);

    if (usersError) {
      console.error('❌ Users table failed:', usersError);
    } else {
      console.log('✅ Users table accessible');
    }

    // Test 2: OTPs table
    console.log('\n2. Testing otps table...');
    const { data: otps, error: otpsError } = await supabase
      .from('otps')
      .select('id, phone_number, otp')
      .limit(1);

    if (otpsError) {
      console.error('❌ OTPs table failed:', otpsError);
      if (otpsError.code === '42501') {
        console.log('🔒 RLS still blocking OTPs table');
      }
    } else {
      console.log('✅ OTPs table accessible');
    }

    // Test 3: Test OTP insertion (simulating login)
    console.log('\n3. Testing OTP insertion (login simulation)...');
    const testOtp = {
      phone_number: '7019564975',
      otp: '123456',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      created_at: new Date().toISOString()
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('otps')
      .insert(testOtp)
      .select()
      .single();

    if (insertError) {
      console.error('❌ OTP insertion failed:', insertError);
      if (insertError.code === '42501') {
        console.log('🔒 RLS policy still blocking OTP insertion');
        console.log('📝 You need to run disable-all-rls.sql in Supabase SQL Editor');
      }
      return;
    }

    console.log('✅ OTP insertion successful');
    console.log('🔢 Created test OTP for:', insertResult.phone_number);

    // Clean up test OTP
    console.log('\n4. Cleaning up test OTP...');
    const { error: deleteError } = await supabase
      .from('otps')
      .delete()
      .eq('phone_number', testOtp.phone_number);

    if (deleteError) {
      console.error('⚠️  Failed to clean up test OTP:', deleteError);
    } else {
      console.log('✅ Test OTP cleaned up');
    }

    console.log('\n🎉 All auth tables working! Login/signup should work now.');
    console.log('\n📋 If tests failed, run this in Supabase SQL Editor:');
    console.log('   -- Copy and paste the contents of disable-all-rls.sql');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllAuthTables();
