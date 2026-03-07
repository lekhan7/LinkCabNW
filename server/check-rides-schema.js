require('dotenv').config();
const { supabase } = require('./config/supabase');

async function checkRidesSchema() {
  try {
    console.log('🔍 Checking rides table schema...');
    
    // Get a sample ride to see the structure
    const { data: rides, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .limit(1);
    
    if (rideError) {
      console.error('❌ Error fetching rides:', rideError);
      return;
    }
    
    if (rides && rides.length > 0) {
      console.log('📋 Rides table columns:');
      Object.keys(rides[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof rides[0][key]} (${rides[0][key]})`);
      });
    } else {
      console.log('📋 No rides found, checking table info...');
      
      // Try to get column info from information_schema
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'rides')
        .eq('table_schema', 'public');
      
      if (colError) {
        console.error('❌ Error getting column info:', colError);
      } else {
        console.log('📋 Rides table columns from schema:');
        columns?.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check error:', error);
  }
}

checkRidesSchema();
