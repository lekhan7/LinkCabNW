// Test script to verify the co-passenger management fix
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000'; // Update if your server runs on different port

// Test user credentials (update with actual test user)
const testUser = {
  email: 'dgsgs@gmail.com', // From the error message
  password: 'password123' // Update with actual password
};

let authToken = null;

// Login and get token
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful, token obtained');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test getting announcement details
async function testAnnouncementAccess(announcementId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/announcements/${announcementId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Announcement data:', response.data);
    
    // Check the structure of created_by
    if (response.data.created_by) {
      console.log('📋 created_by structure:', {
        type: typeof response.data.created_by,
        value: response.data.created_by,
        id: response.data.created_by?.id
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get announcement:', error.response?.data || error.message);
    throw error;
  }
}

// Test getting participants (this should work now)
async function testParticipantsAccess(announcementId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/announcements/${announcementId}/participants`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Participants data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get participants:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runTest() {
  try {
    console.log('🚀 Starting co-passenger management test...');
    
    // The announcement ID from the error message
    const announcementId = '85ef4af7-5353-4b46-9055-cbeed993e60e';
    
    // Login
    await login();
    
    // Test announcement access
    const announcement = await testAnnouncementAccess(announcementId);
    
    // Test participants access (this was failing before)
    await testParticipantsAccess(announcementId);
    
    console.log('✅ All tests passed! The co-passenger management issue should be fixed.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. The server is running on the correct port');
    console.log('2. The test user credentials are correct');
    console.log('3. The announcement ID exists in the database');
    console.log('4. The user is the creator of the announcement');
  }
}

// Run the test
runTest();
