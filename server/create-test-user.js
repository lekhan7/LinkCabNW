require('dotenv').config();
const { supabase } = require('./config/supabase');

async function createTestUser() {
  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', '123456789')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError);
      return;
    }

    if (existingUser) {
      console.log('User already exists:', existingUser);
      console.log('Password in database:', existingUser.password);
      return;
    }

    // Create test user
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: 'Test User',
        code_number: 'TEST001',
        phone_number: '123456789',
        password: '123456', // Plain text for now
        verified: true,
        is_phone_verified: true,
        role: 'user'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('Test user created successfully:', data);
      console.log('Use phone: 123456789, password: 123456');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
