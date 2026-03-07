// Simple test for the announcements/going endpoint
const axios = require('axios');

async function testGoingRidesEndpoint() {
  try {
    console.log('Testing /api/announcements/going endpoint...');
    
    // You'll need to replace this with a valid token from your application
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    const response = await axios.get('http://localhost:5000/api/announcements/going?limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.log('Server error details:', error.response.data);
    }
  }
}

// Only run if token is provided
if (process.argv[2]) {
  testGoingRidesEndpoint();
} else {
  console.log('Please provide a JWT token as an argument:');
  console.log('node test-going-rides.js YOUR_JWT_TOKEN');
}
