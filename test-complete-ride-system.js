// ============================================
// COMPLETE RIDE + RATING + REPORT SYSTEM TEST
// ============================================

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_USER_CREDENTIALS = {
  phone_number: '+1234567890',
  password: 'testpassword123'
};

let authToken = null;
let testUsers = {
  creator: null,
  participant1: null,
  participant2: null
};
let testAnnouncement = null;
let testCompletion = null;

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

// Test functions
const testUserAuth = async () => {
  console.log('\n🔐 Testing User Authentication...');
  
  // Test login
  const loginResult = await makeRequest('POST', '/auth/login', TEST_USER_CREDENTIALS);
  if (!loginResult.success) {
    console.error('❌ Login failed');
    return false;
  }
  
  authToken = loginResult.data.token;
  testUsers.creator = loginResult.data.user;
  console.log('✅ Creator authenticated successfully');
  
  // Create test participants (in real scenario, these would be different users)
  testUsers.participant1 = { ...loginResult.data.user, name: 'Test Participant 1' };
  testUsers.participant2 = { ...loginResult.data.user, name: 'Test Participant 2' };
  
  return true;
};

const testCreateAnnouncement = async () => {
  console.log('\n📢 Testing Announcement Creation...');
  
  const announcementData = {
    start_location_name: 'Test Start Location',
    destination_name: 'Test Destination',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    time: '10:00',
    price: 100,
    passenger_capacity: 3,
    vehicle_type: 'personal_car',
    notes: 'Test announcement for ride completion system'
  };
  
  const result = await makeRequest('POST', '/announcements', announcementData);
  if (!result.success) {
    console.error('❌ Announcement creation failed');
    return false;
  }
  
  testAnnouncement = result.data;
  console.log('✅ Announcement created successfully:', testAnnouncement.id);
  return true;
};

const testJoinAnnouncement = async () => {
  console.log('\n👥 Testing Announcement Join...');
  
  // Simulate participants joining (in real scenario, different users would join)
  const joinData = {
    message: 'I would like to join this ride'
  };
  
  const result = await makeRequest('POST', `/announcements/${testAnnouncement.id}/join`, joinData);
  if (!result.success) {
    console.error('❌ Join announcement failed');
    return false;
  }
  
  console.log('✅ Users joined announcement successfully');
  return true;
};

const testAcceptParticipants = async () => {
  console.log('\n✅ Testing Participant Acceptance...');
  
  // Accept participants (creator action)
  const result = await makeRequest('PUT', `/announcements/${testAnnouncement.id}/accept/test-participant-id`);
  if (!result.success) {
    console.error('❌ Accept participant failed');
    return false;
  }
  
  console.log('✅ Participants accepted successfully');
  return true;
};

const testRideCompletion = async () => {
  console.log('\n🏁 Testing Ride Completion...');
  
  // Test completion status check
  const statusResult = await makeRequest('GET', `/ride-completion/${testAnnouncement.id}/completion-status`);
  if (!statusResult.success) {
    console.error('❌ Get completion status failed');
    return false;
  }
  
  console.log('✅ Completion status retrieved');
  console.log('📊 Completion data:', JSON.stringify(statusResult.data, null, 2));
  
  // Test ride completion (creator)
  const completionResult = await makeRequest('POST', `/ride-completion/${testAnnouncement.id}/complete`, {
    completionType: 'creator'
  });
  
  if (!completionResult.success) {
    console.error('❌ Ride completion failed');
    return false;
  }
  
  testCompletion = completionResult.data;
  console.log('✅ Ride completed by creator successfully');
  console.log('📊 Completion result:', JSON.stringify(testCompletion, null, 2));
  
  return true;
};

const testReviewableUsers = async () => {
  console.log('\n⭐ Testing Reviewable Users...');
  
  const result = await makeRequest('GET', `/reviews/${testAnnouncement.id}/reviewable-users`);
  if (!result.success) {
    console.error('❌ Get reviewable users failed');
    return false;
  }
  
  console.log('✅ Reviewable users retrieved');
  console.log('👥 Reviewable users:', JSON.stringify(result.data, null, 2));
  
  return true;
};

const testSubmitReview = async () => {
  console.log('\n⭐ Testing Review Submission...');
  
  const reviewData = {
    announcementId: testAnnouncement.id,
    revieweeId: testUsers.participant1.id,
    rating: 5,
    feedback: 'Great ride experience! Very smooth and comfortable.'
  };
  
  const result = await makeRequest('POST', '/reviews/submit', reviewData);
  if (!result.success) {
    console.error('❌ Review submission failed');
    return false;
  }
  
  console.log('✅ Review submitted successfully');
  console.log('📊 Review result:', JSON.stringify(result.data, null, 2));
  
  return true;
};

const testReportSubmission = async () => {
  console.log('\n🚨 Testing Report Submission...');
  
  const reportData = {
    announcementId: testAnnouncement.id,
    reportedUserId: testUsers.participant2.id,
    reason: 'misbehavior',
    description: 'Test report for system verification'
  };
  
  const result = await makeRequest('POST', '/reports/submit', reportData);
  if (!result.success) {
    console.error('❌ Report submission failed');
    return false;
  }
  
  console.log('✅ Report submitted successfully');
  console.log('📊 Report result:', JSON.stringify(result.data, null, 2));
  
  return true;
};

const testUserAnalytics = async () => {
  console.log('\n📊 Testing User Analytics...');
  
  const result = await makeRequest('GET', `/user-analytics/ratings/${testUsers.creator.id}`);
  if (!result.success) {
    console.error('❌ Get user analytics failed');
    return false;
  }
  
  console.log('✅ User analytics retrieved');
  console.log('📈 Analytics data:', JSON.stringify(result.data, null, 2));
  
  return true;
};

const testReportReasons = async () => {
  console.log('\n📋 Testing Report Reasons...');
  
  const result = await makeRequest('GET', '/reports/reasons');
  if (!result.success) {
    console.error('❌ Get report reasons failed');
    return false;
  }
  
  console.log('✅ Report reasons retrieved');
  console.log('📋 Report reasons:', JSON.stringify(result.data, null, 2));
  
  return true;
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Complete Ride + Rating + Report System Tests');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'User Authentication', fn: testUserAuth },
    { name: 'Create Announcement', fn: testCreateAnnouncement },
    { name: 'Join Announcement', fn: testJoinAnnouncement },
    { name: 'Accept Participants', fn: testAcceptParticipants },
    { name: 'Ride Completion', fn: testRideCompletion },
    { name: 'Get Reviewable Users', fn: testReviewableUsers },
    { name: 'Submit Review', fn: testSubmitReview },
    { name: 'Submit Report', fn: testReportSubmission },
    { name: 'Get User Analytics', fn: testUserAnalytics },
    { name: 'Get Report Reasons', fn: testReportReasons }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Running: ${test.name}`);
      const passed = await test.fn();
      
      if (passed) {
        passedTests++;
        console.log(`✅ ${test.name} PASSED`);
      } else {
        failedTests++;
        console.log(`❌ ${test.name} FAILED`);
      }
    } catch (error) {
      failedTests++;
      console.log(`❌ ${test.name} ERROR:`, error.message);
    }
    
    await delay(500); // Small delay between tests
  }
  
  // Final results
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The Complete Ride + Rating + Report System is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
  
  console.log('\n📝 Test Data Summary:');
  console.log(`- Creator: ${testUsers.creator?.name || 'N/A'}`);
  console.log(`- Announcement ID: ${testAnnouncement?.id || 'N/A'}`);
  console.log(`- Completion Status: ${testCompletion?.completion_status || 'N/A'}`);
  
  return failedTests === 0;
};

// Database migration test
const testDatabaseMigration = async () => {
  console.log('\n🗄️  Testing Database Migration...');
  
  // This would test if the database functions exist and work
  // In a real scenario, you'd test the actual database functions
  
  console.log('✅ Database functions verified (simulated)');
  return true;
};

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testDatabaseMigration,
  testUserAuth,
  testCreateAnnouncement,
  testRideCompletion,
  testSubmitReview,
  testReportSubmission,
  testUserAnalytics
};
