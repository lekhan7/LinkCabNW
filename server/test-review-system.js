const { supabase } = require('./config/supabase');

async function testReviewSystem() {
  console.log('🧪 Testing Review System...');
  
  try {
    // Test 1: Check if review_details table exists
    console.log('\n📋 Test 1: Checking review_details table...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('review_details')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table does not exist or error:', tableError.message);
      console.log('💡 Please run the SQL migration first:');
      console.log('   psql -h localhost -U postgres -d linkcab -f create-review-details-table.sql');
    } else {
      console.log('✅ review_details table exists');
    }

    // Test 2: Insert a test review
    console.log('\n📝 Test 2: Inserting test review...');
    const testReview = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
      stars: 5,
      review_description: 'Great ride! Very comfortable and on time.',
      report_type: 'Vehicle Condition',
      report_description: 'The car was very clean and well-maintained.'
    };

    const { data: insertedReview, error: insertError } = await supabase
      .from('review_details')
      .insert(testReview)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Failed to insert review:', insertError.message);
    } else {
      console.log('✅ Test review inserted successfully:', insertedReview);
    }

    // Test 3: Fetch reviews
    console.log('\n📖 Test 3: Fetching reviews...');
    const { data: reviews, error: fetchError } = await supabase
      .from('review_details')
      .select(`
        *,
        users!review_details_user_id_fkey (name)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.log('❌ Failed to fetch reviews:', fetchError.message);
    } else {
      console.log('✅ Reviews fetched successfully:', reviews.length, 'reviews');
      reviews.forEach(review => {
        console.log(`   ⭐ ${review.stars} stars - ${review.users?.name || 'Anonymous'}`);
        console.log(`   📝 ${review.review_description || 'No description'}`);
        if (review.report_type) {
          console.log(`   🚨 Report: ${review.report_type} - ${review.report_description || 'No description'}`);
        }
        console.log('');
      });
    }

    // Test 4: Test API endpoint
    console.log('\n🌐 Test 4: Testing API endpoint...');
    const axios = require('axios');
    
    try {
      const response = await axios.post('http://localhost:5000/api/reviews/submit', {
        announcementId: '00000000-0000-0000-0000-000000000000',
        revieweeId: '00000000-0000-0000-0000-000000000001', 
        rating: 4,
        reviewDescription: 'Good experience overall',
        reportType: 'Driver Behavior',
        reportDescription: 'Driver was very professional'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // This will fail but test the route
        }
      });
      
      console.log('✅ API endpoint responded:', response.status);
    } catch (apiError) {
      if (apiError.response && apiError.response.status === 401) {
        console.log('✅ API endpoint working (auth required as expected)');
      } else {
        console.log('❌ API endpoint error:', apiError.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🎉 Review System Test Complete!');
}

// Run the test
testReviewSystem();
