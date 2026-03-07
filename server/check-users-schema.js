const { supabase } = require('./config/supabase');

async function checkSchema() {
  try {
    console.log('Checking users table schema...');
    
    // Try to get one user to see the columns
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error accessing users table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Users table columns:', Object.keys(data[0]));
      console.log('Sample user data:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Users table exists but has no data');
      
      // Try to insert a test user to see what columns are required
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .select('*')
          .limit(0);
        
        console.log('Table access test:', insertError ? insertError : 'Success');
      } catch (err) {
        console.log('Table access error:', err.message);
      }
    }
    
  } catch (err) {
    console.log('Connection error:', err.message);
  }
  
  process.exit(0);
}

checkSchema();
