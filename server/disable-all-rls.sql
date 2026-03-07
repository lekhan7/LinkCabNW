-- Complete RLS Policy Reset for All Auth Tables
-- This script disables RLS on all tables that are needed for authentication

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on otps table (needed for login/signup OTP verification)
ALTER TABLE otps DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other critical tables that might block auth flow
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE ride_shares DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled on key tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'otps', 'announcements', 'notifications')
ORDER BY tablename;

-- Show current policies (should be none after disabling RLS)
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test queries to verify tables are accessible
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as otp_count FROM otps;
