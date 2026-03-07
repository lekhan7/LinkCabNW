const { supabase } = require('./config/supabase');

async function checkRLS() {
  try {
    const tables = ['users', 'announcements', 'ratings', 'reviews', 'ride_reports', 'announcement_participants'];
    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        console.log(`${table}: ${tableError ? 'BLOCKED' : 'ACCESSIBLE'}`);
        if (tableError) console.log(`  Error: ${tableError.message}`);
      } catch (e) {
        console.log(`${table}: ERROR - ${e.message}`);
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
  process.exit(0);
}

checkRLS();
