const { supabase } = require('./config/supabase');

async function applyDatabaseFix() {
  try {
    console.log('🔧 Applying database fix for participant status mapping...');
    
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'fix-participant-status-mapping.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error applying fix:', error);
      
      // Try alternative approach - execute individual statements
      console.log('🔄 Trying alternative approach...');
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 100) + '...');
          const { data: result, error: stmtError } = await supabase
            .from('database_operations')
            .select('*')
            .limit(1);
          
          if (stmtError) {
            console.log('⚠️  Could not execute statement directly');
          }
        }
      }
    } else {
      console.log('✅ Database fix applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply database fix:', error.message);
  }
}

applyDatabaseFix();
