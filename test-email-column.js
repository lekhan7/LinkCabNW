const { supabase } = require('./server/config/supabase');

async function testEmailColumn() {
  try {
    console.log('Testing email column in users table...');
    
    // Test 1: Check if email column exists
    console.log('\n1. Checking if email column exists...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('column_name', 'email')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.error('Error checking column:', columnError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Email column exists:', columns[0]);
    } else {
      console.log('❌ Email column does not exist');
      return;
    }
    
    // Test 2: Try to insert a test user with email
    console.log('\n2. Testing user insertion with email...');
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      phone_number: '+1234567890',
      password: 'testpassword123'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error inserting user with email:', insertError);
    } else {
      console.log('✅ User with email inserted successfully:', insertResult.id);
      
      // Clean up - delete the test user
      await supabase
        .from('users')
        .delete()
        .eq('id', insertResult.id);
      console.log('🧹 Test user cleaned up');
    }
    
    // Test 3: Check existing users for email field
    console.log('\n3. Checking existing users...');
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, phone_number')
      .limit(5);
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
    } else {
      console.log('✅ Existing users (first 5):');
      existingUsers.forEach(user => {
        console.log(`  - ${user.name}: ${user.email || 'NO EMAIL'} (${user.phone_number})`);
      });
    }
    
    console.log('\n🎉 Email column test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testEmailColumn();
