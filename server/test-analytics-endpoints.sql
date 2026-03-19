-- ================================================================
-- CREATE SIMPLE ANALYTICS TEST ENDPOINTS
-- ================================================================

-- Create a simple test view that the analytics routes can query
CREATE OR REPLACE VIEW simple_analytics_test AS
SELECT 
    1 as total_rides_created,
    2 as total_rides_joined, 
    3 as total_reviews_received,
    4 as total_reports_received;

-- Create a function to get simple analytics without complex joins
CREATE OR REPLACE FUNCTION get_simple_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    result := json_build_object(
        'success', true,
        'data', json_build_object(
            'totalRidesCreated', 1,
            'totalRidesJoined', 2,
            'totalReviewsReceived', 3,
            'totalReportsReceived', 4
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create a simple reviews view
CREATE OR REPLACE VIEW simple_reviews_test AS
SELECT 
    gen_random_uuid() as id,
    gen_random_uuid() as announcement_id,
    'Test User' as reviewer_name,
    5 as stars_given,
    'Test review description' as review_description,
    NULL as report_type,
    NULL as report_description,
    CURRENT_TIMESTAMP as date_of_review;
