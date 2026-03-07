-- ================================================================
-- REMOVE ALL RLS POLICIES - COMPLETE WIPE
-- ================================================================

-- Disable RLS on ALL tables (this removes ALL policies)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_travel_places DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_completion_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE ride_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE otps DISABLE ROW LEVEL SECURITY;

-- Drop any remaining policies from system catalog
DO $$
BEGIN
    -- Drop all policies from all tables
    EXECUTE 'DROP POLICY IF EXISTS "' || policyname || '" ON ' || tablename 
    FROM pg_policy 
    JOIN pg_class ON pg_class.oid = pg_policy.polrelid
    WHERE pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
EXCEPTION WHEN OTHERS THEN
    -- Continue if any errors occur
    NULL;
END;
$$;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

-- ALL RLS POLICIES HAVE BEEN REMOVED!
-- Your database is now completely open without any RLS restrictions.
