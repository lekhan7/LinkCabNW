require('dotenv').config();
const { supabase } = require('./config/supabase');
const fs = require('fs');
const path = require('path');

async function deployFavoriteNotificationFunction() {
  try {
    console.log('🔧 Deploying favorite notification function...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create-favorite-notification-function.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 SQL to execute:', sql.substring(0, 200) + '...');
    
    // Execute the SQL using a raw SQL approach
    // Since we can't execute DDL directly via RPC, we'll provide instructions
    
    console.log(`
🔧 MANUAL DEPLOYMENT REQUIRED:

Please run the following SQL in your Supabase SQL Editor:

\`\`\`sql
${sql}
\`\`\`

After running this SQL, the favorite route notifications will work correctly!

🎯 What this fixes:
- When a user creates an announcement matching another user's favorite route
- That user will receive a FAVORITE_ROUTE_MATCH notification
- The notification will include the route details and creator info

📱 After deployment:
1. Create a test favorite route for a user
2. Create a matching announcement as another user  
3. The first user should receive the notification
    `);
    
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
  }
}

deployFavoriteNotificationFunction();
