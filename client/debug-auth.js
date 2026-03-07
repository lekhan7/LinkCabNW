// Debug script to check authentication status
// Run this in browser console on your admin page

console.log('=== Authentication Debug ===');
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

// Check if token exists and is valid
const token = localStorage.getItem('token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Token expires:', new Date(payload.exp * 1000));
    console.log('Token expired:', payload.exp < Date.now() / 1000);
  } catch (error) {
    console.error('Invalid token format:', error);
  }
} else {
  console.log('No token found - user needs to login');
}

console.log('==========================');
