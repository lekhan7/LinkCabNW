const { supabase } = require('./config/supabase');

async function testParticipantsEndpoint() {
  try {
    console.log('🔍 Testing participants data...');
    
    // Get all announcements
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .limit(5);
    
    if (announcementsError) {
      console.error('❌ Error fetching announcements:', announcementsError);
      return;
    }
    
    console.log(`📋 Found ${announcements.length} announcements:`);
    announcements.forEach(ann => {
      console.log(`  - ID: ${ann.id}, Route: ${ann.start_location_name} → ${ann.destination_name}`);
    });
    
    if (announcements.length > 0) {
      // Check participants for first announcement
      const announcementId = announcements[0].id;
      console.log(`\n👥 Checking participants for announcement: ${announcementId}`);
      
      const { data: participants, error: participantsError } = await supabase
        .from('announcement_participants')
        .select(`
          *,
          user:users(
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
          )
        `)
        .eq('announcement_id', announcementId);
      
      if (participantsError) {
        console.error('❌ Error fetching participants:', participantsError);
      } else {
        console.log(`✅ Found ${participants.length} participants:`);
        participants.forEach(participant => {
          console.log(`  - ${participant.user?.name || 'Unknown'} (${participant.status}) - Joined: ${participant.joined_at}`);
        });
      }
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testParticipantsEndpoint();
