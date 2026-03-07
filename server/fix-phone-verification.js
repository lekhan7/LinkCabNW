const { supabase } = require('./config/supabase');

async function updateExistingUsers() {
  try {
    console.log('Updating existing users phone verification status...');
    
    // Update all users to have is_phone_verified = true for testing
    const { data, error } = await supabase
      .from('users')
      .update({ is_phone_verified: true })
      .is('is_phone_verified', null)
      .select();
    
    if (error) {
      console.error('Error updating users:', error);
    } else {
      console.log(`Updated ${data.length} users`);
    }
    
    // Check current users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, name, phone_number, is_phone_verified')
      .limit(5);
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
    } else {
      console.log('Sample users:', users);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

updateExistingUsers();
