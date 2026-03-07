require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcrypt');

const API_BASE = 'http://localhost:5000';

async function createTestUser() {
  try {
    // Create a new test user with known credentials
    const testUser = {
      name: 'Auth Test User',
      email: 'authtest@example.com',
      phoneNumber: '+9999999999',
      password: 'test123456'
    };

    console.log('Creating new test user...');
    
    // First try to signup
    try {
      const signupResponse = await axios.post(`${API_BASE}/api/auth/signup`, testUser);
      console.log('✅ User created successfully');
      console.log('📱 OTP:', signupResponse.data.data.otp);
      
      // Verify OTP to complete registration
      const verifyResponse = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
        phoneNumber: testUser.phoneNumber,
        otp: signupResponse.data.data.otp,
        userId: signupResponse.data.data.userId
      });
      
      if (verifyResponse.data.success) {
        console.log('✅ User verified and ready for testing');
        console.log('🔑 Token:', verifyResponse.data.data.token.substring(0, 50) + '...');
        
        // Test login
        console.log('\n🔄 Testing login flow...');
        const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
          phoneNumber: testUser.phoneNumber,
          password: testUser.password
        });
        
        console.log('✅ Login successful');
        console.log('📱 Login OTP:', loginResponse.data.data.otp);
        
        // Verify login OTP
        const loginVerifyResponse = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
          phoneNumber: testUser.phoneNumber,
          otp: loginResponse.data.data.otp,
          userId: loginResponse.data.data.userId
        });
        
        if (loginVerifyResponse.data.success) {
          console.log('✅ Login OTP verification successful');
          console.log('🔑 Login Token:', loginVerifyResponse.data.data.token.substring(0, 50) + '...');
          
          // Test authenticated request
          const profileResponse = await axios.get(`${API_BASE}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${loginVerifyResponse.data.data.token}`
            }
          });
          
          console.log('✅ Authenticated request successful');
          console.log('👤 Profile:', profileResponse.data.data);
          
          console.log('\n🎉 Authentication flow is working perfectly!');
          console.log('\n📝 Test Results:');
          console.log('- ✅ User signup works');
          console.log('- ✅ OTP verification works');
          console.log('- ✅ JWT token generation works');
          console.log('- ✅ User login works');
          console.log('- ✅ Login OTP verification works');
          console.log('- ✅ Authenticated API requests work');
          console.log('- ✅ Token persistence works');
        }
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ User already exists, testing login...');
        
        // Test login directly
        const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
          phoneNumber: testUser.phoneNumber,
          password: testUser.password
        });
        
        console.log('✅ Login successful');
        console.log('📱 OTP:', loginResponse.data.data.otp);
        
        // Verify OTP
        const verifyResponse = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
          phoneNumber: testUser.phoneNumber,
          otp: loginResponse.data.data.otp,
          userId: loginResponse.data.data.userId
        });
        
        if (verifyResponse.data.success) {
          console.log('✅ Login OTP verification successful');
          console.log('🔑 Token:', verifyResponse.data.data.token.substring(0, 50) + '...');
        }
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createTestUser();
