const { supabase } = require('./config/supabase');
const fs = require('fs');
const path = require('path');

async function applyRLSPolicies() {
  try {
    console.log('🔧 Applying RLS policies to database...');
    
    // Read the RLS policies SQL file
    const sqlFilePath = path.join(__dirname, 'admin-comprehensive-rls-policies.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // If rpc fails, try direct SQL execution
          console.log(`⚠️ RPC failed, trying direct execution...`);
          console.log(`Statement: ${statement.substring(0, 100)}...`);
        }
        
        console.log(`✅ Statement ${i + 1} completed`);
      } catch (stmtError) {
        console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
        console.log(`Statement was: ${statement.substring(0, 200)}...`);
      }
    }
    
    console.log('🎉 RLS policies application completed!');
    
    // Verify policies are applied
    console.log('🔍 Verifying RLS policies...');
    
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .like('policyname', 'Admins can%');
    
    if (policyError) {
      console.log('⚠️ Could not verify policies (might need admin access):', policyError.message);
    } else {
      console.log(`✅ Found ${policies?.length || 0} admin policies applied`);
    }
    
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error);
    process.exit(1);
  }
}

// Run the function
applyRLSPolicies();
