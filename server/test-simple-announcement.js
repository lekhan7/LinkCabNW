require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testSimpleAnnouncement() {
  try {
    // Create a test token
    const testUser = {
      id: 'b89eb4f0-61e1-4c14-856d-0f5c8a5c01ac',
      email: 'test@example.com',
      role: 'user'
    };
    
    const token = jwt.sign(testUser, process.env.JWT_SECRET);
    
    console.log('Testing simple announcement creation...');
    
    // Test with minimal fields (no geography)
    const response = await fetch('http://localhost:5000/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        start_location_name: 'Simple Test Start',
        destination_name: 'Simple Test Destination',
        date: '2026-02-28',
        time: '12:00',
        price: 25.00,
        passenger_capacity: 2,
        notes: 'Simple test without geography'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Simple test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ Simple test failed:');
      console.log('Status:', response.status);
      console.log('Response:', result);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testSimpleAnnouncement();
