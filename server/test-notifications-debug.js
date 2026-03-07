require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testNotifications() {
  try {
    console.log('🔍 Testing get_user_notifications function...');
    
    // Test with a dummy UUID first
    const { data: testData, error: testError } = await supabase.rpc('get_user_notifications', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_limit: 5
    });
    
    console.log('Dummy UUID test:', { testData, testError });
    
    // Now let's check if there are any notifications in the table
    const { data: allNotifications, error: allError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);
    
    console.log('All notifications in table:', { allNotifications, allError });
    
    // Check if the function exists
    const { data: functionExists } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'get_user_notifications');
    
    console.log('Function exists:', functionExists);
    
  } catch (err) {
    console.error('Test error:', err);
  }
}

testNotifications();
