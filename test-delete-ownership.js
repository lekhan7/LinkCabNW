// Debug script to test announcement ownership
const axios = require('axios');

async function testDeleteOwnership() {
  try {
    // Replace with actual token and announcement ID
    const token = 'YOUR_JWT_TOKEN_HERE';
    const announcementId = '31c4081a-cf14-4bcc-b840-31992a4a5742'; // From your error
    
    console.log('Testing announcement ownership check...');
    
    // First, get the announcement details to see the structure
    try {
      const response = await axios.get(`http://localhost:5000/api/announcements/${announcementId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Announcement data:', JSON.stringify(response.data, null, 2));
      console.log('📊 created_by field:', response.data.created_by);
      console.log('📊 created_by type:', typeof response.data.created_by);
      
    } catch (error) {
      console.log('❌ Error fetching announcement:', error.response?.data || error.message);
    }
    
    // Now try the delete to see the detailed logs
    console.log('\n🗑️ Attempting delete...');
    try {
      const deleteResponse = await axios.delete(`http://localhost:5000/api/announcements/${announcementId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Delete successful:', deleteResponse.data);
    } catch (error) {
      console.log('❌ Delete failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run if token provided
if (process.argv[2]) {
  testDeleteOwnership();
} else {
  console.log('Please provide a JWT token:');
  console.log('node test-delete-ownership.js YOUR_JWT_TOKEN');
}
