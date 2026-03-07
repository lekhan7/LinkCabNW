-- ================================================================
-- FIX ANALYTICS RLS ISSUES
-- ================================================================

-- First, disable RLS on all analytics-related tables
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcement_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
-- Note: ride_reports table will be handled separately if it exists

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view own announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view participants" ON announcement_participants;
DROP POLICY IF EXISTS "Users can view ratings" ON ratings;
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view reports" ON ride_reports;
DROP POLICY IF EXISTS "Users can view reports" ON reports;

-- Enable RLS back on with proper policies for analytics
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- Only enable RLS on ride_reports if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_reports' AND table_schema = 'public') THEN
        ALTER TABLE ride_reports ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports' AND table_schema = 'public') THEN
        ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create comprehensive policies for analytics access

-- Users table policies
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Announcements table policies
CREATE POLICY "Enable read access for all announcements" ON announcements
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for announcements" ON announcements
    FOR INSERT WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "Enable update for own announcements" ON announcements
    FOR UPDATE USING (created_by = auth.uid()::text);

-- Announcement participants policies
CREATE POLICY "Enable read access for participants" ON announcement_participants
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for participants" ON announcement_participants
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Enable update for own participation" ON announcement_participants
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Ratings table policies
CREATE POLICY "Enable read access for ratings" ON ratings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for ratings" ON ratings
    FOR INSERT WITH CHECK (from_user_id = auth.uid()::text);

CREATE POLICY "Enable update for own ratings" ON ratings
    FOR UPDATE USING (from_user_id = auth.uid()::text);

-- Reviews table policies
CREATE POLICY "Enable read access for reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for reviews" ON reviews
    FOR INSERT WITH CHECK (reviewer_id = auth.uid()::text);

CREATE POLICY "Enable update for own reviews" ON reviews
    FOR UPDATE USING (reviewer_id = auth.uid()::text);

-- Ride reports table policies (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_reports' AND table_schema = 'public') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "Enable read access for reports" ON ride_reports FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY IF NOT EXISTS "Enable insert for reports" ON ride_reports FOR INSERT WITH CHECK (reporter_id = auth.uid()::text)';
        EXECUTE 'CREATE POLICY IF NOT EXISTS "Enable update for own reports" ON ride_reports FOR UPDATE USING (reporter_id = auth.uid()::text)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports' AND table_schema = 'public') THEN
        EXECUTE 'CREATE POLICY IF NOT EXISTS "Enable read access for reports" ON reports FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY IF NOT EXISTS "Enable insert for reports" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid()::text)';
        EXECUTE 'CREATE POLICY IF NOT EXISTS "Enable update for own reports" ON reports FOR UPDATE USING (reporter_id = auth.uid()::text)';
    END IF;
END $$;

-- ================================================================
-- CREATE HELPER FUNCTIONS FOR ANALYTICS
-- ================================================================

-- Function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    ride_reports_exists BOOLEAN;
    reports_exists BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'ride_reports' AND table_schema = 'public'
    ) INTO ride_reports_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reports' AND table_schema = 'public'
    ) INTO reports_exists;
    
    -- Build analytics object with conditional reports count
    IF ride_reports_exists THEN
        SELECT json_build_object(
            'total_rides_completed', (
                SELECT COUNT(*)::int 
                FROM announcements 
                WHERE created_by = user_uuid AND ride_completed = true
            ),
            'total_reviews_received', (
                SELECT COUNT(*)::int 
                FROM ratings 
                WHERE to_user_id = user_uuid
            ),
            'average_rating', COALESCE((
                SELECT AVG(stars)::numeric(3,2) 
                FROM ratings 
                WHERE to_user_id = user_uuid
            ), 0),
            'total_reports_received', (
                SELECT COUNT(*)::int 
                FROM ride_reports 
                WHERE reported_user_id = user_uuid
            )
        ) INTO result;
    ELSIF reports_exists THEN
        SELECT json_build_object(
            'total_rides_completed', (
                SELECT COUNT(*)::int 
                FROM announcements 
                WHERE created_by = user_uuid AND ride_completed = true
            ),
            'total_reviews_received', (
                SELECT COUNT(*)::int 
                FROM ratings 
                WHERE to_user_id = user_uuid
            ),
            'average_rating', COALESCE((
                SELECT AVG(stars)::numeric(3,2) 
                FROM ratings 
                WHERE to_user_id = user_uuid
            ), 0),
            'total_reports_received', (
                SELECT COUNT(*)::int 
                FROM reports 
                WHERE reported_user_id = user_uuid
            )
        ) INTO result;
    ELSE
        SELECT json_build_object(
            'total_rides_completed', (
                SELECT COUNT(*)::int 
                FROM announcements 
                WHERE created_by = user_uuid AND ride_completed = true
            ),
            'total_reviews_received', (
                SELECT COUNT(*)::int 
                FROM ratings 
                WHERE to_user_id = user_uuid
            ),
            'average_rating', COALESCE((
                SELECT AVG(stars)::numeric(3,2) 
                FROM ratings 
                WHERE to_user_id = user_uuid
            ), 0),
            'total_reports_received', 0
        ) INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user completed rides
CREATE OR REPLACE FUNCTION get_user_completed_rides(user_uuid UUID, limit_param INT DEFAULT 10, offset_param INT DEFAULT 0)
RETURNS TABLE (
    ride_id UUID,
    start_location_name TEXT,
    destination_name TEXT,
    date DATE,
    "time" TIME,
    role TEXT,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH created_rides AS (
        SELECT 
            a.id,
            a.start_location_name,
            a.destination_name,
            a.date,
            a."time",
            'creator' as role,
            a.completed_at
        FROM announcements a
        WHERE a.created_by = user_uuid 
        AND a.ride_completed = true
    ),
    participated_rides AS (
        SELECT 
            a.id,
            a.start_location_name,
            a.destination_name,
            a.date,
            a."time",
            'participant' as role,
            a.completed_at
        FROM announcement_participants ap
        JOIN announcements a ON ap.announcement_id = a.id
        WHERE ap.user_id = user_uuid 
        AND ap.status = 'accepted'
        AND a.ride_completed = true
    )
    SELECT * FROM created_rides
    UNION ALL
    SELECT * FROM participated_rides
    ORDER BY completed_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

-- RLS policies have been updated for analytics access!
-- All tables now have proper read access for analytics functionality.
