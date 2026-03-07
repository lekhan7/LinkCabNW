// Debug script to test the admin feedback API
// Run this in browser console on the admin feedback page

console.log('=== Admin Feedback Debug ===');

// 1. Check if we're logged in
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);

// 2. Check Supabase session
import('../../config/supabase').then(({ supabase }) => {
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    console.log('Supabase session exists:', !!session);
    console.log('Session error:', error);
    console.log('Session user:', session?.user?.email);
  });
}).catch(err => console.log('Supabase import error:', err));

// 3. Test the API directly
fetch('/api/admin/feedback', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token || 'test-token'}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('API Response status:', response.status);
  console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
  return response.json();
})
.then(data => {
  console.log('API Response data:', data);
  console.log('Data length:', data.data?.length);
  console.log('Success:', data.success);
})
.catch(error => {
  console.error('API Error:', error);
});

// 4. Test direct Supabase query
import('../../config/supabase').then(({ supabase }) => {
  supabase
    .from('feedback')
    .select('*')
    .then(({ data, error }) => {
      console.log('Direct Supabase data:', data);
      console.log('Direct Supabase error:', error);
      console.log('Direct Supabase count:', data?.length);
    });
}).catch(err => console.log('Direct query error:', err));

console.log('=== End Debug ===');
