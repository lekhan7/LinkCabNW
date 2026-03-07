require('dotenv').config();
const { supabase } = require('./config/supabase');

async function checkAnnouncements() {
  try {
    // Get all announcements
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error fetching announcements:', error);
    } else {
      console.log('Announcements found:', data.length);
      console.log('Sample announcement:', data[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAnnouncements();
