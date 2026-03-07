-- ================================================================
-- TEST SCRIPT FOR NEW REFUSE TABLE SYSTEM
-- ================================================================

-- Test 1: Check if refuse table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'refuse' 
ORDER BY ordinal_position;

-- Test 2: Check if old tables are dropped
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reviews', 'reports', 'ratings')
ORDER BY table_name;

-- Test 3: Check if functions exist
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname IN ('submit_refuse_review', 'get_user_review_analytics')
ORDER BY proname;

-- Test 4: Test inserting a sample review
DO $$
DECLARE
    test_announcement_id UUID;
    test_reviewer_id UUID;
    test_reviewee_id UUID;
    result RECORD;
BEGIN
    -- Get sample IDs for testing
    SELECT id INTO test_announcement_id FROM announcements LIMIT 1;
    SELECT id INTO test_reviewer_id FROM users LIMIT 1;
    SELECT id INTO test_reviewee_id FROM users OFFSET 1 LIMIT 1;
    
    IF test_announcement_id IS NOT NULL AND test_reviewer_id IS NOT NULL AND test_reviewee_id IS NOT NULL THEN
        -- Insert a test review
        INSERT INTO refuse (
            announcement_id,
            reviewer_id,
            reviewee_id,
            stars,
            review_description,
            is_report,
            created_at
        ) VALUES (
            test_announcement_id,
            test_reviewer_id,
            test_reviewee_id,
            5,
            'Test review from migration script',
            false,
            NOW()
        );
        
        RAISE NOTICE '✓ Test review inserted successfully';
        
        -- Test the analytics function
        SELECT * INTO result FROM get_user_review_analytics(test_reviewee_id);
        RAISE NOTICE '✓ Analytics function works for user %', test_reviewee_id;
        
    ELSE
        RAISE NOTICE '⚠ Could not run test - need sample data in announcements and users tables';
    END IF;
END $$;

-- Test 5: Check notification types
SELECT 
    column_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'notifications_type_check';

-- Test 6: Sample query to get reviews for a user
SELECT 
    r.id,
    r.stars,
    r.review_description,
    r.created_at,
    reviewer.name as reviewer_name,
    reviewee.name as reviewee_name,
    a.start_location_name,
    a.destination_name
FROM refuse r
JOIN users reviewer ON r.reviewer_id = reviewer.id
JOIN users reviewee ON r.reviewee_id = reviewee.id
JOIN announcements a ON r.announcement_id = a.id
WHERE r.is_report = false
ORDER BY r.created_at DESC
LIMIT 5;

-- Test 7: Sample query to get reports for a user
SELECT 
    r.id,
    r.report_category,
    r.report_description,
    r.report_severity,
    r.created_at,
    reporter.name as reporter_name,
    reviewee.name as reviewee_name,
    a.start_location_name,
    a.destination_name
FROM refuse r
JOIN users reporter ON r.reviewer_id = reporter.id
JOIN users reviewee ON r.reviewee_id = reviewee.id
JOIN announcements a ON r.announcement_id = a.id
WHERE r.is_report = true
ORDER BY r.created_at DESC
LIMIT 5;

-- Test 8: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'refuse'
ORDER BY policyname;

-- ================================================================
-- VERIFICATION COMPLETE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'REFUSE TABLE SYSTEM TEST COMPLETE!';
    RAISE NOTICE 'Check the results above for any errors';
    RAISE NOTICE '===========================================';
END $$;
