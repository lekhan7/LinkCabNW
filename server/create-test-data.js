const { supabase } = require('./config/supabase');

async function createTestData() {
  try {
    console.log('🔍 Creating test data...');
    
    // Get a user to create test announcement
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();
    
    if (userError || !testUser) {
      console.error('❌ No test user found');
      return;
    }
    
    console.log(`✅ Using test user: ${testUser.name} (${testUser.id})`);
    
    // Create a test announcement
    const { data: newAnnouncement, error: announcementError } = await supabase
      .from('announcements')
      .insert({
        created_by: testUser.id,
        start_location_name: 'Test Start',
        destination_name: 'Test Destination',
        date: '2026-02-28',
        time: '10:00',
        price: 100,
        passenger_capacity: 4,
        vehicle_type: 'car'
      })
      .select()
      .single();
    
    if (announcementError) {
      console.error('❌ Error creating announcement:', announcementError);
      return;
    }
    
    console.log(`✅ Created test announcement: ${newAnnouncement.id}`);
    
    // Create a test participant
    const { data: newParticipant, error: participantError } = await supabase
      .from('announcement_participants')
      .insert({
        announcement_id: newAnnouncement.id,
        user_id: testUser.id,
        status: 'accepted',
        joined_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (participantError) {
      console.error('❌ Error creating participant:', participantError);
      return;
    }
    
    console.log(`✅ Created test participant: ${newParticipant.id}`);
    
    // Verify data exists
    const { data: checkParticipants } = await supabase
      .from('announcement_participants')
      .select('*, user:users(id, name, phone_number, email, verified, is_phone_verified)')
      .eq('announcement_id', newAnnouncement.id);
    
    console.log(`👥 Verification query result:`, checkParticipants);
    
    console.log('\n✅ Test data created successfully!');
    console.log('You can now test with announcement ID:', newAnnouncement.id);
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
  }
}

createTestData();
