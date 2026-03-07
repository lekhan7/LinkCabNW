const { supabase } = require('./config/supabase');

async function testParticipantsData() {
  try {
    console.log('🔍 Testing participants data structure...');
    
    // Get all announcements
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);
    
    if (announcementsError || announcements.length === 0) {
      console.error('❌ No announcements found');
      return;
    }
    
    const announcementId = announcements[0].id;
    console.log(`📋 Testing announcement: ${announcementId}`);
    
    // Test participants query
    const { data: participants, error: participantsError } = await supabase
      .from('announcement_participants')
      .select('*')
      .eq('announcement_id', announcementId);
    
    if (participantsError) {
      console.error('❌ Error fetching participants:', participantsError);
      return;
    }
    
    console.log(`👥 Found ${participants.length} participants:`);
    
    // Test user data for each participant
    for (const participant of participants) {
      console.log(`\n🔍 Testing user data for participant: ${participant.user_id}`);
      
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          phone_number,
          code_number,
          email,
          verified,
          is_phone_verified,
          profile_picture,
          average_rating,
          completed_trips,
          total_trips,
          is_premium,
          created_at,
          last_active
        `)
        .eq('id', participant.user_id)
        .single();
      
      if (userError) {
        console.error(`❌ Error fetching user ${participant.user_id}:`, userError);
      } else {
        console.log(`✅ User found: ${user?.name || 'No name'}`);
        console.log(`   Phone: ${user?.phone_number || 'No phone'}`);
        console.log(`   Email: ${user?.email || 'No email'}`);
        console.log(`   Completed trips: ${user?.completed_trips || 0}`);
        console.log(`   Average rating: ${user?.average_rating || '0.00'}`);
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testParticipantsData();
