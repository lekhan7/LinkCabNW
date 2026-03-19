-- ================================================================
-- QUICK ANALYTICS DEBUG FIX
-- ================================================================

-- The issue is likely that the analytics routes are crashing due to database errors
-- Let's create a temporary fix by creating the exact tables and data they expect

-- First, ensure we have a user to test with
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        INSERT INTO users (id, name, email, phone_number, password)
        VALUES ('00000000-0000-0000-0000-000000000001', 'Test User', 'test@example.com', '+1234567890', 'password');
    END IF;
END $$;

-- Ensure we have some announcements
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM announcements) = 0 THEN
        INSERT INTO announcements (id, created_by, start_location_name, destination_name, date, time, price, passenger_capacity)
        VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Test Start', 'Test End', CURRENT_DATE, '10:00', 100, 4);
    END IF;
END $$;

-- Ensure we have some review details
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM review_details) = 0 THEN
        INSERT INTO review_details (id, announcement_id, reviewee_id, stars, review_description, created_at)
        VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 5, 'Test review', CURRENT_TIMESTAMP);
    END IF;
END $$;

-- Ensure we have some announcement participants
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM announcement_participants) = 0 THEN
        INSERT INTO announcement_participants (id, announcement_id, user_id, status, joined_at)
        VALUES ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'accepted', CURRENT_TIMESTAMP);
    END IF;
END $$;

-- Create a simple test query to verify everything works
CREATE OR REPLACE FUNCTION test_analytics_queries()
RETURNS TEXT AS $$
BEGIN
    -- Test all the queries the analytics routes use
    PERFORM COUNT(*) FROM announcements WHERE created_by = '00000000-0000-0000-0000-000000000001';
    PERFORM COUNT(*) FROM announcement_participants WHERE user_id = '00000000-0000-0000-0000-000000000001' AND status = 'accepted';
    PERFORM COUNT(*) FROM review_details WHERE reviewee_id = '00000000-0000-0000-0000-000000000001';
    PERFORM COUNT(*) FROM review_details WHERE reviewee_id = '00000000-0000-0000-0000-000000000001' AND report_type IS NOT NULL;
    
    RETURN 'All analytics queries work correctly';
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT test_analytics_queries();
