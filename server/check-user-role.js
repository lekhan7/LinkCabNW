const { supabase } = require('./config/supabase');

async function checkUserRole() {
  try {
    // Get current user session (you'll need to provide a valid JWT token)
    console.log('🔍 To check user role, run this SQL in Supabase:');
    console.log('');
    console.log('-- Check your current role');
    console.log('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5;');
    console.log('');
    console.log('-- If your role is not "admin", update it:');
    console.log('UPDATE users SET role = \'admin\' WHERE email = \'your-email@example.com\';');
    console.log('');
    console.log('-- Verify the update:');
    console.log('SELECT id, name, email, role FROM users WHERE email = \'your-email@example.com\';');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserRole();
