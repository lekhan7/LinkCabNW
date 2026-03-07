// Test script to verify admin users API endpoint
const fetch = require('node-fetch');

async function testAdminUsersAPI() {
  try {
    console.log('Testing admin users API endpoint...');
    
    // Test the basic endpoint without authentication (should fail with 401)
    const response = await fetch('http://localhost:5000/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const result = await response.text();
    console.log('Response body:', result);

    if (response.status === 401) {
      console.log('✅ API endpoint is working and requires authentication (as expected)');
    } else if (response.status === 404) {
      console.log('❌ API endpoint not found - check if server is running and route is mounted');
    } else {
      console.log('ℹ️ Unexpected response status');
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server is not running. Please start the server first.');
    }
  }
}

testAdminUsersAPI();
