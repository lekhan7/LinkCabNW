require('dotenv').config();
const { supabase } = require('./config/supabase');

async function checkUserSchema() {
  try {
    // Get all users to see the schema
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('User schema (first user):');
      console.log(JSON.stringify(data[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserSchema();
