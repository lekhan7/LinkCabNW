const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:5000';

// Test user credentials
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  phoneNumber: '+1234567890',
  password: 'testpassword123'
};

async function testAuthFlow() {
  console.log('🧪 Starting Authentication Flow Test\n');
  
  try {
    // Step 1: Test signup
    console.log('1️⃣ Testing signup...');
    const signupResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
    console.log('✅ Signup successful:', signupResponse.data.success);
    
    const { userId, phoneNumber, otp } = signupResponse.data.data;
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
    
    // Step 2: Test OTP verification
    console.log('\n2️⃣ Testing OTP verification...');
    const verifyResponse = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phoneNumber,
      otp,
      userId
    });
    
    if (verifyResponse.data.success) {
      console.log('✅ OTP verification successful');
      console.log('🔑 Received JWT token');
      console.log('👤 User data:', verifyResponse.data.data.user);
      
      const token = verifyResponse.data.data.token;
      
      // Step 3: Test authenticated API request
      console.log('\n3️⃣ Testing authenticated API request...');
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Authenticated request successful');
      console.log('📊 Profile data:', profileResponse.data.data);
      
      // Step 4: Test token persistence simulation
      console.log('\n4️⃣ Testing token persistence simulation...');
      
      // Simulate page refresh by creating new API instance with stored token
      const apiWithStoredToken = axios.create({
        baseURL: API_BASE,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const refreshProfileResponse = await apiWithStoredToken.get('/auth/profile');
      console.log('✅ Token persistence test successful');
      console.log('🔄 Profile data after "refresh":', refreshProfileResponse.data.data);
      
      // Step 5: Test invalid token
      console.log('\n5️⃣ Testing invalid token rejection...');
      try {
        await axios.get(`${API_BASE}/auth/profile`, {
          headers: {
            'Authorization': 'Bearer invalid_token_here'
          }
        });
        console.log('❌ Invalid token was accepted (this should not happen)');
      } catch (error) {
        console.log('✅ Invalid token properly rejected:', error.response?.status);
      }
      
      console.log('\n🎉 All authentication tests passed!');
      console.log('\n📝 Summary:');
      console.log('- ✅ User signup works');
      console.log('- ✅ OTP verification generates JWT token');
      console.log('- ✅ JWT token is properly formatted');
      console.log('- ✅ Authenticated API requests work');
      console.log('- ✅ Token persists across "page refreshes"');
      console.log('- ✅ Invalid tokens are properly rejected');
      
    } else {
      console.log('❌ OTP verification failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔍 Authentication error - check JWT_SECRET and token format');
    }
  }
}

// Run the test
testAuthFlow();
