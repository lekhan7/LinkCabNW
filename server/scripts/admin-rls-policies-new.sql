-- Admin RLS Policies for LinkCab
-- This file creates Row Level Security policies for admin access

-- First, ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admin full access to users" ON users;
DROP POLICY IF EXISTS "Admin full access to announcements" ON announcements;
DROP POLICY IF EXISTS "Admin full access to join_requests" ON join_requests;
DROP POLICY IF EXISTS "Admin full access to notifications" ON notifications;
DROP POLICY IF EXISTS "Admin full access to reviews" ON reviews;
DROP POLICY IF EXISTS "Admin full access to reports" ON reports;
DROP POLICY IF EXISTS "Admin full access to ride_participants" ON ride_participants;

-- Create admin policies for full access

-- Users table - Admin can do everything
CREATE POLICY "Admin full access to users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Announcements table - Admin can do everything
CREATE POLICY "Admin full access to announcements" ON announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Join Requests table - Admin can do everything
CREATE POLICY "Admin full access to join_requests" ON join_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Notifications table - Admin can do everything
CREATE POLICY "Admin full access to notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Reviews table - Admin can do everything
CREATE POLICY "Admin full access to reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Reports table - Admin can do everything
CREATE POLICY "Admin full access to reports" ON reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Ride Participants table - Admin can do everything
CREATE POLICY "Admin full access to ride_participants" ON ride_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create a function to check admin role (for easier policy management)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure service role has necessary permissions for server operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create admin-specific views for better performance
CREATE OR REPLACE VIEW admin_users AS
SELECT * FROM users WHERE is_admin();

CREATE OR REPLACE VIEW admin_announcements AS
SELECT * FROM announcements WHERE is_admin();

CREATE OR REPLACE VIEW admin_join_requests AS
SELECT * FROM join_requests WHERE is_admin();

CREATE OR REPLACE VIEW admin_notifications AS
SELECT * FROM notifications WHERE is_admin();

CREATE OR REPLACE VIEW admin_reviews AS
SELECT * FROM reviews WHERE is_admin();

CREATE OR REPLACE VIEW admin_reports AS
SELECT * FROM reports WHERE is_admin();

CREATE OR REPLACE VIEW admin_ride_participants AS
SELECT * FROM ride_participants WHERE is_admin();

-- Add helpful comments
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user is an admin';
COMMENT ON VIEW admin_users IS 'Admin view of all users with admin access check';
COMMENT ON VIEW admin_announcements IS 'Admin view of all announcements with admin access check';
COMMENT ON VIEW admin_join_requests IS 'Admin view of all join requests with admin access check';
COMMENT ON VIEW admin_notifications IS 'Admin view of all notifications with admin access check';
COMMENT ON VIEW admin_reviews IS 'Admin view of all reviews with admin access check';
COMMENT ON VIEW admin_reports IS 'Admin view of all reports with admin access check';
COMMENT ON VIEW admin_ride_participants IS 'Admin view of all ride participants with admin access check';
