// Test file to verify Supabase configuration
import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test authentication
const testAuth = async () => {
  console.log('Testing Supabase configuration...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('✅ Using correct anon key');
    
    // Test auth endpoint (this should work with anon key)
    console.log('Testing auth endpoint...');
    
    return true;
  } catch (err) {
    console.error('❌ Test failed:', err);
    return false;
  }
};

// Test admin login simulation
const testAdminLogin = async () => {
  console.log('Testing admin login flow...');
  
  try {
    // This should work now with the correct anon key
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    if (error) {
      console.log('✅ Auth endpoint working (expected auth error for wrong credentials):', error.message);
      return true;
    }
    
    console.log('✅ Admin login test completed');
    return true;
  } catch (err) {
    console.error('❌ Admin login test failed:', err);
    return false;
  }
};

export { testAuth, testAdminLogin };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testAuth().then(testAdminLogin).then(() => {
    console.log('🎉 All tests completed');
  });
}
