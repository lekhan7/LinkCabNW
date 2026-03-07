// Script to set a user as admin - use this if you don't have any admin users
const { supabase } = require('./config/supabase');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promoteUserToAdmin() {
  try {
    console.log('👑 User Admin Promotion Tool\n');

    // Get all users first
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }

    console.log('📋 Available users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Unknown'} (${user.email}) - Role: ${user.role}`);
    });

    rl.question('\nEnter the number of the user to promote to admin: ', async (answer) => {
      const userIndex = parseInt(answer) - 1;
      
      if (userIndex < 0 || userIndex >= users.length) {
        console.log('❌ Invalid selection');
        rl.close();
        return;
      }

      const selectedUser = users[userIndex];
      
      console.log(`\n🔄 Promoting ${selectedUser.name} (${selectedUser.email}) to admin...`);

      const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', selectedUser.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update user role:', error);
        rl.close();
        return;
      }

      console.log('✅ User promoted to admin successfully!');
      console.log(`👤 ${data.name} (${data.email}) is now an admin`);
      console.log('\n📝 You can now use this user to access admin routes.');

      rl.close();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
  }
}

// Alternative: Promote by email directly
async function promoteByEmail(email) {
  try {
    console.log(`👑 Promoting ${email} to admin...`);

    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update user role:', error);
      return;
    }

    if (!data) {
      console.log('❌ User not found with that email');
      return;
    }

    console.log('✅ User promoted to admin successfully!');
    console.log(`👤 ${data.name} (${data.email}) is now an admin`);
    console.log('\n📝 You can now use this user to access admin routes.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Check if email was provided as command line argument
const emailArg = process.argv[2];

if (emailArg) {
  promoteByEmail(emailArg);
} else {
  promoteUserToAdmin();
}
