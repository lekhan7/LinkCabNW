require('dotenv').config();
const { supabase } = require('./config/supabase');

async function createSampleAnnouncements() {
  try {
    // Get the test user ID
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

    // Create sample announcements
    const sampleAnnouncements = [
      {
        created_by: user.id,
        start_location_name: 'Downtown',
        start_location: 'POINT(-74.0060 40.7128)', // NYC coordinates
        destination_name: 'Airport',
        destination: 'POINT(-73.7781 40.6413)', // NYC Airport coordinates
        date: '2026-02-28',
        time: '08:00',
        price: 25.00,
        passenger_capacity: 4,
        vehicle_type: 'personal_car',
        notes: 'Going to airport tomorrow morning, have 2 seats available'
      },
      {
        created_by: user.id,
        start_location_name: 'Tech Park',
        start_location: 'POINT(-74.0060 40.7128)',
        destination_name: 'Residential Area',
        destination: 'POINT(-73.935242 40.730610)',
        date: '2026-02-27',
        time: '18:00',
        price: 15.00,
        passenger_capacity: 4,
        vehicle_type: 'personal_car',
        notes: 'Daily commute from office to home, 1 seat available'
      },
      {
        created_by: user.id,
        start_location_name: 'City Center',
        start_location: 'POINT(-74.0060 40.7128)',
        destination_name: 'Beach Town',
        destination: 'POINT(-74.0060 40.7128)',
        date: '2026-03-01',
        time: '10:00',
        price: 40.00,
        passenger_capacity: 7,
        vehicle_type: 'personal_car',
        notes: 'Weekend trip to nearby city, 3 seats available'
      }
    ];

    // Insert announcements
    const { data, error } = await supabase
      .from('announcements')
      .insert(sampleAnnouncements)
      .select();

    if (error) {
      console.error('Error creating announcements:', error);
    } else {
      console.log('✅ Created', data.length, 'sample announcements:');
      data.forEach((announcement, index) => {
        console.log(`${index + 1}. ${announcement.notes} - ${announcement.start_location_name} to ${announcement.destination_name}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createSampleAnnouncements();
