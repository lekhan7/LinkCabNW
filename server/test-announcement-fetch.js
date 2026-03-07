require('dotenv').config();
const AnnouncementService = require('./services/announcementService');
const { supabase } = require('./config/supabase');

async function testAnnouncementFetch() {
  try {
    console.log('Testing announcement fetch...');
    const announcements = await AnnouncementService.findAll({ rideCompleted: false });
    
    if (announcements.length > 0) {
      console.log('Raw announcements from database:');
      console.log(JSON.stringify(announcements[0], null, 2));
    } else {
      console.log('No announcements found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAnnouncementFetch();
