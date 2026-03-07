require('dotenv').config();
const { supabase } = require('./config/supabase');

async function checkUserData() {
  try {
    // Get the test user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', '123456789')
      .single();

    if (error) {
      console.error('Error fetching user:', error);
    } else {
      console.log('User data structure:');
      console.log(JSON.stringify(user, null, 2));
      
      console.log('\nField names:');
      console.log('name:', user.name);
      console.log('phone_number:', user.phone_number);
      console.log('email:', user.email);
      console.log('profile_picture:', user.profile_picture);
      console.log('is_phone_verified:', user.is_phone_verified);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserData();
