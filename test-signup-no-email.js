const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test data for signup without email
const testSignup = async () => {
  try {
    console.log('🧪 Testing signup without email...');
    
    // Create form data with all required fields except email
    const formData = new FormData();
    formData.append('name', 'Test User');
    formData.append('phoneNumber', '+1234567890');
    formData.append('password', 'testpassword123');
    
    // Create a dummy image file for profile photo
    const dummyImagePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(dummyImagePath)) {
      // Create a simple 1x1 pixel JPEG file
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
      ]);
      fs.writeFileSync(dummyImagePath, jpegBuffer);
    }
    
    formData.append('profilePhoto', fs.createReadStream(dummyImagePath), 'test-image.jpg');
    
    // Make request to signup endpoint
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response body:', result);
    
    if (response.status === 201 && result.success) {
      console.log('✅ Signup successful without email!');
      console.log('🔔 OTP generated:', result.data.otp);
      console.log('📱 Phone number:', result.data.phoneNumber);
    } else {
      console.log('❌ Signup failed:', result.message);
    }
    
    // Clean up test file
    if (fs.existsSync(dummyImagePath)) {
      fs.unlinkSync(dummyImagePath);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testSignup();
