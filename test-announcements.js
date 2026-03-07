// Test script for announcements API
const axios = require('axios');

async function testAnnouncementsAPI() {
  try {
    console.log('Testing announcements API...');
    
    // Test without authentication first (public endpoint)
    console.log('\n1. Testing public endpoint /api/announcements/all');
    try {
      const response = await axios.get('http://localhost:5000/api/announcements/all?limit=5');
      console.log('✅ Public endpoint working:', response.data.success);
      console.log('📊 Found announcements:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ Public endpoint failed:', error.response?.data || error.message);
    }
    
    // Test with authentication (replace with actual token)
    const token = 'YOUR_JWT_TOKEN_HERE';
    console.log('\n2. Testing authenticated endpoint /api/announcements');
    
    if (token !== 'YOUR_JWT_TOKEN_HERE') {
      try {
        const response = await axios.get('http://localhost:5000/api/announcements?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Authenticated endpoint working:', response.data.success);
        console.log('📊 Found announcements:', response.data.data?.length || 0);
        console.log('🔍 Sample announcement:', response.data.data?.[0] || 'None');
      } catch (error) {
        console.log('❌ Authenticated endpoint failed:', error.response?.data || error.message);
      }
    } else {
      console.log('⚠️  Skipping authenticated test - no token provided');
      console.log('   To test with authentication: node test-announcements.js YOUR_JWT_TOKEN');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAnnouncementsAPI();
