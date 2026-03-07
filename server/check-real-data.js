const { supabase } = require('./config/supabase');

async function checkRealData() {
  try {
    console.log('🔍 Checking real database data...');
    
    // Check if there are any users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, phone_number, code_number, email, verified, is_phone_verified, is_premium, created_at')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`👥 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.name || 'NULL'}, Phone: ${user.phone_number || 'NULL'}, Email: ${user.email || 'NULL'}, Verified: ${user.verified}, Phone Verified: ${user.is_phone_verified}, Premium: ${user.is_premium}`);
    });
    
    // Check if there are any announcement_participants
    const { data: participants, error: participantsError } = await supabase
      .from('announcement_participants')
      .select('*')
      .limit(5);
    
    if (participantsError) {
      console.error('❌ Error fetching participants:', participantsError);
      return;
    }
    
    console.log(`👥 Found ${participants.length} participants:`);
    participants.forEach(participant => {
      console.log(`  - ID: ${participant.id}, User ID: ${participant.user_id}, Status: ${participant.status}, Joined: ${participant.joined_at}`);
    });
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkRealData();
