require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testCreateAnnouncementAPI() {
  try {
    // Create a test token
    const testUser = {
      id: 'b89eb4f0-61e1-4c14-856d-0f5c8a5c01ac',
      email: 'test@example.com',
      role: 'user'
    };
    
    const token = jwt.sign(testUser, process.env.JWT_SECRET);
    
    console.log('Testing announcement creation API...');
    


    
    // Test the API endpoint
    const response = await fetch('http://localhost:5000/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        start_location_name: 'API Test Start',
        start_location: 'POINT(-74.0060 40.7128)',
        destination_name: 'API Test Destination',
        destination: 'POINT(-73.7781 40.6413)',
        date: '2026-02-28',
        time: '11:00',
        price: 35.00,
        passenger_capacity: 3,
        vehicle_type: 'personal_car',
        comfort_level: 'comfortable',
        seat_preference: 'partial-sharing',
        route_type: 'daily-route',
        notes: 'API test announcement'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ API test failed:');
      console.log('Status:', response.status);
      console.log('Response:', result);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCreateAnnouncementAPI();
