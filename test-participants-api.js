// Test the participants endpoint directly
fetch('http://localhost:5000/api/announcements/test-announcement-id/participants', {
  headers: {
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('🔍 Direct API test response:', data);
})
.catch(error => {
  console.error('❌ Direct API test error:', error);
});
