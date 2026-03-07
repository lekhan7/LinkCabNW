require('dotenv').config();
const { supabase } = require('./config/supabase');
const bcrypt = require('bcrypt');

async function createSimpleTestUser() {
  try {
    // Delete existing user with phone 123456789
    await supabase
      .from('users')
      .delete()
      .eq('phone_number', '123456789');

    // Hash the password
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create new test user with simple password
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: 'Test User',
        email: 'test@example.com',
        phone_number: '123456789',
        password: hashedPassword,
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

createSimpleTestUser();
