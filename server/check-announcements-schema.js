require('dotenv').config();
const { supabase } = require('./config/supabase');

async function checkAnnouncementsSchema() {
  try {
    // Get one announcement to see the schema
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error);
    } else if (data && data.length > 0) {
      console.log('Announcements schema (sample):');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No announcements found, checking table structure...');
      
      // Try to insert a minimal announcement to see what columns exist
      const { data: testData, error: testError } = await supabase
        .from('announcements')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('Table access error:', testError);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAnnouncementsSchema();
