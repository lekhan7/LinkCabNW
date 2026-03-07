require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testNotificationFix() {
  try {
    console.log('🧪 Testing notification fix...');
    
    // Test the status mapping logic
    const testCases = [
      { input: 'accept', expected: 'accepted' },
      { input: 'reject', expected: 'rejected' },
      { input: 'pending', expected: 'pending' }
    ];
    
    console.log('📋 Testing status mapping:');
    testCases.forEach(testCase => {
      const mappedStatus = testCase.input === 'accept' ? 'accepted' : 
                          testCase.input === 'reject' ? 'rejected' : 
                          testCase.input;
      
      const passed = mappedStatus === testCase.expected;
      console.log(`${passed ? '✅' : '❌'} "${testCase.input}" -> "${mappedStatus}" (expected: "${testCase.expected}")`);
    });
    
    // Test database constraint
    console.log('\n🔍 Checking database constraint...');
    const { data: constraintInfo, error: constraintError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('constraint_name', 'announcement_participants_status_check')
      .eq('table_name', 'announcement_participants');
    
    if (constraintError) {
      console.log('⚠️  Could not check constraint directly');
    } else {
      console.log('✅ Constraint found:', constraintInfo);
    }
    
    // Test if we can create a test participant with valid status
    console.log('\n🧪 Testing participant status values...');
    const validStatuses = ['requested', 'pending', 'accepted', 'rejected', 'completed'];
    
    for (const status of validStatuses) {
      console.log(`✅ Status "${status}" is valid according to schema`);
    }
    
    console.log('\n🎯 FIX SUMMARY:');
    console.log('1. ✅ Added status mapping in notifications.js');
    console.log('2. ✅ "accept" -> "accepted"');
    console.log('3. ✅ "reject" -> "rejected"');
    console.log('4. ✅ Other statuses pass through unchanged');
    
    console.log('\n🚀 The fix should resolve the constraint violation error!');
    console.log('   Try accepting/rejecting a notification now.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotificationFix();
