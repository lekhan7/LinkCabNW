// Test to find actual columns in users table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRealSchema() {
  try {
    console.log('Testing actual database schema...');
    
    // Try to insert with minimal fields to see what works
    const testData = {
      name: 'Test User',
      phone_number: '1234567890',
      password: 'hashedpassword123'
    };
    
    console.log('Trying to insert with minimal fields:', Object.keys(testData));
    
    const { data, error } = await supabase
      .from('users')
      .insert(testData)
      .select();
    
    if (error) {
      console.log('❌ Insert failed:', error.message);
      
      // Try to get info about existing table structure
      console.log('Trying to get existing users...');
      const { data: existingUsers, error: selectError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log('❌ Select failed:', selectError.message);
      } else if (existingUsers && existingUsers.length > 0) {
        console.log('✅ Found existing user. Columns:', Object.keys(existingUsers[0]));
      } else {
        console.log('ℹ️ No existing users found');
      }
    } else {
      console.log('✅ Success! User created with data:', data);
      
      // Clean up test user
      if (data && data[0]) {
        await supabase.from('users').delete().eq('id', data[0].id);
        console.log('🧹 Test user cleaned up');
      }
    }
    
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
  
  process.exit(0);
}

testRealSchema();
