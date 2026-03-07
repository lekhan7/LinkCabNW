const axios = require('axios');

// Test user ID from the error logs
const testUserId = '7132d2a8-7e8c-4264-8263-b43abf7f2b19';

async function testAnalyticsEndpoints() {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Analytics Endpoints...\n');
  
  // Test endpoints without authentication (should return 401/403)
  const endpoints = [
    {
      name: 'User Ratings',
      url: `${baseURL}/user-analytics/ratings/${testUserId}`
    },
    {
      name: 'User Reviews', 
      url: `${baseURL}/user-analytics/reviews/${testUserId}?limit=10`
    },
    {
      name: 'User Completed Rides',
      url: `${baseURL}/user-analytics/completed-rides/${testUserId}?limit=50`
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📍 Testing ${endpoint.name}: ${endpoint.url}`);
      const response = await axios.get(endpoint.url);
      console.log(`✅ ${endpoint.name} - Status: ${response.status}`);
      console.log(`📊 Data:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log(`⚠️  ${endpoint.name} - Status: ${error.response.status}`);
        console.log(`📝 Error:`, error.response.data);
        
        if (error.response.status === 404) {
          console.log('❌ Route not found - this is the main issue we need to fix');
        } else if (error.response.status === 401 || error.response.status === 403) {
          console.log('🔐 Authentication required - this is expected behavior');
        }
      } else {
        console.log(`❌ ${endpoint.name} - Network Error:`, error.message);
      }
    }
    console.log('---\n');
  }
}

testAnalyticsEndpoints().catch(console.error);
