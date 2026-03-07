const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function checkExistingUser() {
  try {
    // Try login with different phone numbers
    const phoneNumbers = ['+1234567890', '1234567890', '+919876543210'];
    
    for (const phoneNumber of phoneNumbers) {
      try {
        console.log(`Trying login with ${phoneNumber}...`);
        const response = await axios.post(`${API_BASE}/api/auth/login`, {
          phoneNumber,
          password: 'testpassword123'
        });
        
        if (response.data.success) {
          console.log(`✅ Login successful with ${phoneNumber}`);
          console.log(`📱 OTP: ${response.data.data.otp}`);
          console.log(`🆔 UserID: ${response.data.data.userId}`);
          
          // Test OTP verification
          const verifyResponse = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
            phoneNumber,
            otp: response.data.data.otp,
            userId: response.data.data.userId
          });
          
          if (verifyResponse.data.success) {
            console.log('✅ OTP verification successful');
            console.log('🔑 JWT Token:', verifyResponse.data.data.token.substring(0, 50) + '...');
            
            // Test authenticated request
            const profileResponse = await axios.get(`${API_BASE}/api/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${verifyResponse.data.data.token}`
              }
            });
            
            console.log('✅ Authenticated request successful');
            console.log('👤 User data:', profileResponse.data.data);
            return;
          }
        }
      } catch (error) {
        console.log(`❌ Login failed with ${phoneNumber}:`, error.response?.data?.message);
      }
    }
    
    console.log('❌ No valid phone number found');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkExistingUser();
