const { supabase } = require('./config/supabase');

async function checkAdminUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, name')
      .eq('role', 'admin');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Admin users found:', users?.length || 0);
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
      });
    } else {
      console.log('No admin users found. You may need to update a user role to admin.');
      
      // Show all users to help identify who should be admin
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, email, role, name')
        .limit(5);
      
      if (allUsers && allUsers.length > 0) {
        console.log('\nSample users (to help identify admin):');
        allUsers.forEach(user => {
          console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
        });
      }
    }
  } catch (err) {
    console.error('Connection error:', err.message);
  }
  process.exit(0);
}

checkAdminUsers();
