const fetch = require('node-fetch');

// Test the reviewable users endpoint
async function testReviewableUsers() {
  try {
    // You'll need to replace these with actual values
    const testRideId = 'your-test-ride-id';
    const testToken = 'your-jwt-token';

    console.log('Testing GET /api/reviews/:rideId/reviewable-users...');
    
    const response = await fetch(`http://localhost:5000/api/reviews/${testRideId}/reviewable-users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    if (response.status === 200 && result.success) {
      console.log('✅ SUCCESS: Endpoint is working correctly');
      console.log('Users returned:', result.users?.length || 0);
    } else {
      console.log('❌ ERROR: Endpoint returned an error');
      console.log('Error message:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('To run this test:');
console.log('1. Start your server: npm start');
console.log('2. Replace testRideId and testToken with actual values');
console.log('3. Run: node test-reviewable-users.js');

testReviewableUsers();
