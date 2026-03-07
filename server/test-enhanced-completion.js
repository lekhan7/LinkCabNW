/**
 * Test Enhanced Ride Completion Logic
 * Tests that rides are only marked as completed after ALL passengers
 * have completed the ride AND provided feedback for each other
 */

const { supabase } = require('./config/supabase');

async function testEnhancedCompletion() {
    console.log('🧪 Testing Enhanced Ride Completion Logic...\n');

    try {
        // Test 1: Check if function exists and works
        console.log('📋 Test 1: Testing update_ride_completion_status function');
        
        // Create a test scenario with multiple participants
        const testAnnouncementId = 'test-announcement-id';
        const testUser1 = 'user-1-id';
        const testUser2 = 'user-2-id';
        const testUser3 = 'user-3-id';

        // Simulate completion by first user
        console.log('👤 User 1 completing ride...');
        const result1 = await supabase.rpc('update_ride_completion_status', {
            announcement_uuid: testAnnouncementId,
            user_uuid: testUser1,
            completion_type: 'creator'
        });

        console.log('📊 Result after User 1 completion:', result1.data);

        // Simulate completion by second user
        console.log('👤 User 2 completing ride...');
        const result2 = await supabase.rpc('update_ride_completion_status', {
            announcement_uuid: testAnnouncementId,
            user_uuid: testUser2,
            completion_type: 'participant'
        });

        console.log('📊 Result after User 2 completion:', result2.data);

        // Simulate completion by third user
        console.log('👤 User 3 completing ride...');
        const result3 = await supabase.rpc('update_ride_completion_status', {
            announcement_uuid: testAnnouncementId,
            user_uuid: testUser3,
            completion_type: 'participant'
        });

        console.log('📊 Result after User 3 completion:', result3.data);

        // Test 2: Check can_complete_ride function
        console.log('\n📋 Test 2: Testing can_complete_ride function');
        const canCompleteResult = await supabase.rpc('can_complete_ride', {
            announcement_uuid: testAnnouncementId,
            user_uuid: testUser1
        });

        console.log('📊 Can complete ride result:', canCompleteResult.data);

        // Test 3: Test review submission and completion status
        console.log('\n📋 Test 3: Testing review impact on completion');
        
        // Add reviews between participants
        console.log('⭐ Adding reviews...');
        
        // User 1 reviews User 2
        await supabase.rpc('submit_review', {
            ride_uuid: testAnnouncementId,
            reviewer_uuid: testUser1,
            reviewee_uuid: testUser2,
            rating: 5,
            feedback: 'Great co-passenger!'
        });

        // User 1 reviews User 3
        await supabase.rpc('submit_review', {
            ride_uuid: testAnnouncementId,
            reviewer_uuid: testUser1,
            reviewee_uuid: testUser3,
            rating: 4,
            feedback: 'Good experience'
        });

        // User 2 reviews User 1
        await supabase.rpc('submit_review', {
            ride_uuid: testAnnouncementId,
            reviewer_uuid: testUser2,
            reviewee_uuid: testUser1,
            rating: 5,
            feedback: 'Excellent driver!'
        });

        // User 2 reviews User 3
        await supabase.rpc('submit_review', {
            ride_uuid: testAnnouncementId,
            reviewer_uuid: testUser2,
            reviewee_uuid: testUser3,
            rating: 4,
            feedback: 'Nice person'
        });

        // User 3 reviews User 1
        await supabase.rpc('submit_review', {
            ride_uuid: testAnnouncementId,
            reviewer_uuid: testUser3,
            reviewee_uuid: testUser1,
            rating: 5,
            feedback: 'Very professional'
        });

        // User 3 reviews User 2
        await supabase.rpc('submit_review', {
            ride_uuid: testAnnouncementId,
            reviewer_uuid: testUser3,
            reviewee_uuid: testUser2,
            rating: 5,
            feedback: 'Great conversation!'
        });

        // Check completion status after all reviews
        console.log('🔍 Checking final completion status...');
        const finalStatus = await supabase.rpc('can_complete_ride', {
            announcement_uuid: testAnnouncementId,
            user_uuid: testUser1
        });

        console.log('📊 Final status:', finalStatus.data);

        console.log('\n✅ Enhanced completion logic test completed!');
        console.log('\n📝 Summary:');
        console.log('- All users must complete the ride');
        console.log('- All users must provide feedback for each other');
        console.log('- Only then is the ride marked as fully completed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Details:', error);
    }
}

// Test the completion flow with real data
async function testRealAnnouncement() {
    console.log('\n🌍 Testing with real announcement data...');

    try {
        // Get a real announcement
        const { data: announcements, error } = await supabase
            .from('announcements')
            .select('id, created_by, ride_completed')
            .eq('ride_completed', false)
            .limit(1);

        if (error) throw error;

        if (!announcements || announcements.length === 0) {
            console.log('ℹ️ No incomplete announcements found for testing');
            return;
        }

        const announcement = announcements[0];
        console.log(`📝 Testing with announcement: ${announcement.id}`);

        // Get participants
        const { data: participants } = await supabase
            .from('announcement_participants')
            .select('user_id, status')
            .eq('announcement_id', announcement.id)
            .eq('status', 'accepted');

        console.log(`👥 Found ${participants?.length || 0} participants`);

        // Test completion status
        const statusResult = await supabase.rpc('can_complete_ride', {
            announcement_uuid: announcement.id,
            user_uuid: announcement.created_by
        });

        console.log('📊 Current completion status:', statusResult.data);

    } catch (error) {
        console.error('❌ Real test failed:', error.message);
    }
}

// Run tests
async function runTests() {
    await testEnhancedCompletion();
    await testRealAnnouncement();
}

// Export for use in other files
module.exports = {
    testEnhancedCompletion,
    testRealAnnouncement,
    runTests
};

// Run if called directly
if (require.main === module) {
    runTests();
}
