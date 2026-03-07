require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testCreateAnnouncement() {
  try {
    // Get the test user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', '123456789')
      .single();

    if (userError || !user) {
      console.error('Test user not found:', userError);
      return;
    }

    console.log('Using user ID:', user.id);

    // Create a test announcement
    const announcementData = {
      created_by: user.id,
      start_location_name: 'Test Start',
      start_location: 'POINT(-74.0060 40.7128)',
      destination_name: 'Test Destination',
      destination: 'POINT(-73.7781 40.6413)',
      date: '2026-02-28',
      time: '10:00',
      price: 30.00,
      passenger_capacity: 4,
      vehicle_type: 'personal_car',
      comfort_level: 'comfortable',
      seat_preference: 'partial-sharing',
      route_type: 'daily-route',
      notes: 'Test announcement creation'
    };

    const { data, error } = await supabase
      .from('announcements')
      .insert(announcementData)
      .select('*');

    if (error) {
      console.error('Error creating announcement:', error);
    } else {
      console.log('✅ Test announcement created successfully:');
      console.log('Announcement ID:', data[0].id);
      console.log('Route:', data[0].start_location_name, 'to', data[0].destination_name);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCreateAnnouncement();
