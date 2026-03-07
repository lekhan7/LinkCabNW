// Quick test to check if participants endpoint exists and works
console.log('🧪 Testing participants endpoint...');

// Test with a real announcement ID (you'll need to replace this with an actual ID)
const testAnnouncementId = 'cd70cdfe-c591-4767-b016-fe58d8d05a4b';

fetch(`http://localhost:5000/api/announcements/${testAnnouncementId}/participants`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
    // Note: You'll need to add a real JWT token here
  }
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Error:', error);
});

console.log('If this fails with 401/403, the endpoint exists but needs authentication');
console.log('If this fails with 404, the endpoint doesn\'t exist');
console.log('If this fails with 500, there\'s a server error');
