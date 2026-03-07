const { supabase } = require('./config/supabase');

async function checkUser() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', '7019564975')
      .single();
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('User found:', data);
      console.log('Password hash:', data.password);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();
