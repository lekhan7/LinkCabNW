const { supabase } = require('./config/supabase');

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking for admin users...');
    
    // Check all users with their roles
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.name || 'No name'} (${user.email}) - Role: ${user.role}`);
    });

    // Check for admin users specifically
    const adminUsers = users.filter(user => user.role === 'admin');
    console.log(`\n👑 Admin users: ${adminUsers.length}`);
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found. You may need to update a user to admin role.');
      console.log('\n💡 To make a user admin, you can run:');
      console.log('UPDATE users SET role = \'admin\' WHERE email = \'user@example.com\';');
    } else {
      adminUsers.forEach(admin => {
        console.log(`- ${admin.name} (${admin.email})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function makeUserAdmin(email) {
  try {
    console.log(`🔧 Making user ${email} an admin...`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email)
      .select('id, name, email, role')
      .single();

    if (error) {
      console.error('❌ Error updating user role:', error);
      return;
    }

    if (data) {
      console.log('✅ User updated successfully:');
      console.log(`- Name: ${data.name}`);
      console.log(`- Email: ${data.email}`);
      console.log(`- Role: ${data.role}`);
    } else {
      console.log('❌ User not found with that email');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
if (process.argv[2] === '--make-admin' && process.argv[3]) {
  makeUserAdmin(process.argv[3]);
} else {
  checkAdminUsers();
}
