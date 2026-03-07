// Script to setup the review and report database functions
// Run this with: node setup-review-functions.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupFunctions() {
    console.log('🔧 Setting up review and report database functions...');
    
    try {
        // Read the SQL files
        const fs = require('fs');
        const path = require('path');
        
        const getReviewableUsersSQL = fs.readFileSync(
            path.join(__dirname, 'create-get-reviewable-users-function.sql'), 
            'utf8'
        );
        
        const submitReviewSQL = fs.readFileSync(
            path.join(__dirname, 'create-submit-review-function.sql'), 
            'utf8'
        );
        
        const submitReportSQL = fs.readFileSync(
            path.join(__dirname, 'create-submit-report-function.sql'), 
            'utf8'
        );
        
        console.log('📝 Creating get_reviewable_users function...');
        const { error: error1 } = await supabase.rpc('exec_sql', { sql: getReviewableUsersSQL });
        if (error1) {
            console.error('Error creating get_reviewable_users:', error1);
        } else {
            console.log('✅ get_reviewable_users function created successfully');
        }
        
        console.log('📝 Creating submit_review function...');
        const { error: error2 } = await supabase.rpc('exec_sql', { sql: submitReviewSQL });
        if (error2) {
            console.error('Error creating submit_review:', error2);
        } else {
            console.log('✅ submit_review function created successfully');
        }
        
        console.log('📝 Creating submit_report function...');
        const { error: error3 } = await supabase.rpc('exec_sql', { sql: submitReportSQL });
        if (error3) {
            console.error('Error creating submit_report:', error3);
        } else {
            console.log('✅ submit_report function created successfully');
        }
        
        console.log('\n🎉 Database functions setup completed!');
        console.log('📋 Next steps:');
        console.log('1. Restart your server');
        console.log('2. Test the Complete Ride functionality');
        console.log('3. Verify the review popup appears');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        
        // Alternative: Try direct SQL execution
        console.log('\n🔄 Trying alternative setup method...');
        try {
            const { data, error } = await supabase
                .from('pg_functions')
                .select('*')
                .eq('proname', 'get_reviewable_users');
                
            if (error) {
                console.log('⚠️ Please run the SQL files manually in your Supabase dashboard:');
                console.log('1. Open Supabase Dashboard');
                console.log('2. Go to SQL Editor');
                console.log('3. Run create-get-reviewable-users-function.sql');
                console.log('4. Run create-submit-review-function.sql');
                console.log('5. Run create-submit-report-function.sql');
            } else {
                console.log('✅ Functions may already exist');
            }
        } catch (altError) {
            console.log('⚠️ Please run the SQL files manually in Supabase dashboard');
        }
    }
}

// Manual SQL execution function
async function executeSQL(sql, description) {
    console.log(`📝 ${description}...`);
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            return false;
        }
        console.log(`✅ ${description} completed`);
        return true;
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        return false;
    }
}

setupFunctions();
