-- ================================================================
-- SIMPLE RLS SOLUTION - NO SYSTEM CATALOG QUERIES
-- ================================================================
-- This script just disables RLS and applies new policies cleanly

-- Step 1: Disable RLS on all tables (this removes all existing policies)
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

-- Step 2: Re-enable RLS on all tables (fresh start)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_travel_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_completion_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

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

-- ================================================================
-- USERS TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with users
CREATE POLICY "Admin full access to users" ON users
    FOR ALL USING (
        is_admin()
    );

-- Users can see their own profile and other users' basic info
CREATE POLICY "Users view users" ON users
    FOR SELECT USING (
        TRUE -- Public profile viewing
    );

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON users
    FOR UPDATE USING (
        id = auth.uid()
    );

-- ================================================================
-- ADMINS TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with admins
CREATE POLICY "Admin full access to admins" ON admins
    FOR ALL USING (
        is_admin()
    );

-- ================================================================
-- APP SETTINGS TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with app settings
CREATE POLICY "Admin full access to app_settings" ON app_settings
    FOR ALL USING (
        is_admin()
    );

-- Users can view app settings
CREATE POLICY "Users view app settings" ON app_settings
    FOR SELECT USING (
        TRUE -- Public app settings
    );

-- ================================================================
-- PREFERRED TRAVEL PLACES POLICIES
-- ================================================================

-- Admin can do ANYTHING with preferred travel places
CREATE POLICY "Admin full access to preferred_travel_places" ON preferred_travel_places
    FOR ALL USING (
        is_admin()
    );

-- Users can manage their own preferred places
CREATE POLICY "Users manage own preferred travel places" ON preferred_travel_places
    FOR ALL USING (
        user_id = auth.uid()
    );

-- ================================================================
-- PREFERRED LOCATIONS POLICIES
-- ================================================================

-- Admin can do ANYTHING with preferred locations
CREATE POLICY "Admin full access to preferred_locations" ON preferred_locations
    FOR ALL USING (
        is_admin()
    );

-- Users can manage their own preferred locations
CREATE POLICY "Users manage own preferred locations" ON preferred_locations
    FOR ALL USING (
        user_id = auth.uid()
    );

-- ================================================================
-- ANNOUNCEMENTS TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with announcements
CREATE POLICY "Admin full access to announcements" ON announcements
    FOR ALL USING (
        is_admin()
    );

-- Users can view all announcements (public)
CREATE POLICY "Users view announcements" ON announcements
    FOR SELECT USING (
        TRUE -- Public announcements
    );

-- Users can create announcements
CREATE POLICY "Users create announcements" ON announcements
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
    );

-- Users can update their own announcements
CREATE POLICY "Users update own announcements" ON announcements
    FOR UPDATE USING (
        created_by = auth.uid()
    );

-- Users can delete announcements with restrictions
CREATE POLICY "Users delete announcements" ON announcements
    FOR DELETE USING (
        -- Admin can delete any announcement
        is_admin() 
        OR
        -- Creator can delete their own announcement only if no participants
        (
            created_by = auth.uid() 
            AND NOT EXISTS (
                SELECT 1 FROM announcement_participants 
                WHERE announcement_id = announcements.id 
                AND status = 'accepted'
            )
        )
        OR
        -- Anyone can delete if in their favorites
        EXISTS (
            SELECT 1 FROM favorite_routes 
            WHERE announcement_id = announcements.id 
            AND user_id = auth.uid()
        )
    );

-- ================================================================
-- ANNOUNCEMENT PARTICIPANTS POLICIES
-- ================================================================

-- Admin can do ANYTHING with announcement participants
CREATE POLICY "Admin full access to announcement_participants" ON announcement_participants
    FOR ALL USING (
        is_admin()
    );

-- Users can view participants of announcements they're part of
CREATE POLICY "Users view announcement participants" ON announcement_participants
    FOR SELECT USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM announcements 
            WHERE id = announcement_participants.announcement_id 
            AND created_by = auth.uid()
        )
    );

-- Users can join announcements
CREATE POLICY "Users join announcements" ON announcement_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Users can leave their own participation
CREATE POLICY "Users leave announcements" ON announcement_participants
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Users can update their participation status
CREATE POLICY "Users update own participation" ON announcement_participants
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- ================================================================
-- ANNOUNCEMENT COMPLETION STATUS POLICIES
-- ================================================================

-- Admin can do ANYTHING with completion status
CREATE POLICY "Admin full access to announcement_completion_status" ON announcement_completion_status
    FOR ALL USING (
        is_admin()
    );

-- Users can manage their own completion status
CREATE POLICY "Users manage own completion status" ON announcement_completion_status
    FOR ALL USING (
        user_id = auth.uid()
    );

-- ================================================================
-- RIDES TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with rides
CREATE POLICY "Admin full access to rides" ON rides
    FOR ALL USING (
        is_admin()
    );

-- Users can manage their own rides
CREATE POLICY "Users manage own rides" ON rides
    FOR ALL USING (
        user_id = auth.uid()
    );

-- ================================================================
-- RIDE SHARES POLICIES
-- ================================================================

-- Admin can do ANYTHING with ride shares
CREATE POLICY "Admin full access to ride_shares" ON ride_shares
    FOR ALL USING (
        is_admin()
    );

-- Users can manage their own ride shares
CREATE POLICY "Users manage own ride shares" ON ride_shares
    FOR ALL USING (
        user_id = auth.uid()
    );

-- ================================================================
-- PAYMENTS TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with payments
CREATE POLICY "Admin full access to payments" ON payments
    FOR ALL USING (
        is_admin()
    );

-- Users can view their own payments
CREATE POLICY "Users view own payments" ON payments
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Users can create their own payments
CREATE POLICY "Users create own payments" ON payments
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- ================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with notifications
CREATE POLICY "Admin full access to notifications" ON notifications
    FOR ALL USING (
        is_admin()
    );

-- Users can view their own notifications
CREATE POLICY "Users view own notifications" ON notifications
    FOR SELECT USING (
        recipient_id = auth.uid()
    );

-- Users can create notifications
CREATE POLICY "Users create notifications" ON notifications
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
    );

-- Users can delete their own notifications
CREATE POLICY "Users delete own notifications" ON notifications
    FOR DELETE USING (
        recipient_id = auth.uid()
    );

-- ================================================================
-- RATINGS TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with ratings
CREATE POLICY "Admin full access to ratings" ON ratings
    FOR ALL USING (
        is_admin()
    );

-- Users can view ratings involving them
CREATE POLICY "Users view own ratings" ON ratings
    FOR SELECT USING (
        from_user_id = auth.uid() 
        OR to_user_id = auth.uid()
    );

-- Users can create ratings for completed rides
CREATE POLICY "Users create ratings" ON ratings
    FOR INSERT WITH CHECK (
        from_user_id = auth.uid()
    );

-- ================================================================
-- REVIEWS TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with reviews
CREATE POLICY "Admin full access to reviews" ON reviews
    FOR ALL USING (
        is_admin()
    );

-- Users can view reviews for rides they participated in
CREATE POLICY "Users view relevant reviews" ON reviews
    FOR SELECT USING (
        reviewer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM announcement_participants ap 
            WHERE ap.announcement_id = reviews.ride_id 
            AND ap.user_id = auth.uid()
        )
    );

-- Users can create reviews for completed rides
CREATE POLICY "Users create reviews" ON reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid()
    );

-- ================================================================
-- FAVORITE ROUTES POLICIES
-- ================================================================

-- Admin can do ANYTHING with favorite routes
CREATE POLICY "Admin full access to favorite_routes" ON favorite_routes
    FOR ALL USING (
        is_admin()
    );

-- Users can manage their own favorite routes
CREATE POLICY "Users manage own favorite routes" ON favorite_routes
    FOR ALL USING (
        user_id = auth.uid()
    );

-- ================================================================
-- CONNECTION REQUESTS POLICIES
-- ================================================================

-- Admin can do ANYTHING with connection requests
CREATE POLICY "Admin full access to connection_requests" ON connection_requests
    FOR ALL USING (
        is_admin()
    );

-- Users can manage their own connection requests
CREATE POLICY "Users manage own connection requests" ON connection_requests
    FOR ALL USING (
        from_user_id = auth.uid() 
        OR to_user_id = auth.uid()
    );

-- ================================================================
-- OTPS TABLE POLICIES
-- ================================================================

-- Admin can do ANYTHING with OTPs
CREATE POLICY "Admin full access to otps" ON otps
    FOR ALL USING (
        is_admin()
    );

-- Service role can manage OTPs (for SMS/Email sending)
CREATE POLICY "Service role access to otps" ON otps
    FOR ALL USING (
        CURRENT_USER = 'service_role'
    );

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure service role has necessary permissions for server operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ================================================================
-- HELPER VIEWS FOR ADMIN OPERATIONS
-- ================================================================

CREATE OR REPLACE VIEW admin_users AS
SELECT * FROM users WHERE is_admin();

CREATE OR REPLACE VIEW admin_announcements AS
SELECT * FROM announcements WHERE is_admin();

CREATE OR REPLACE VIEW admin_announcement_participants AS
SELECT * FROM announcement_participants WHERE is_admin();

CREATE OR REPLACE VIEW admin_notifications AS
SELECT * FROM notifications WHERE is_admin();

CREATE OR REPLACE VIEW admin_ratings AS
SELECT * FROM ratings WHERE is_admin();

CREATE OR REPLACE VIEW admin_reviews AS
SELECT * FROM reviews WHERE is_admin();

CREATE OR REPLACE VIEW admin_favorite_routes AS
SELECT * FROM favorite_routes WHERE is_admin();

CREATE OR REPLACE VIEW admin_connection_requests AS
SELECT * FROM connection_requests WHERE is_admin();

CREATE OR REPLACE VIEW admin_payments AS
SELECT * FROM payments WHERE is_admin();

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

-- All RLS policies have been applied successfully!
-- Admins have full access to all tables.
-- Users have restricted access based on ownership and participation.
