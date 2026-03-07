-- ============================================
-- COMPREHENSIVE ADMIN RLS POLICIES
-- ============================================
-- This script adds admin-specific RLS policies to all tables
-- to ensure admin users have full access for management operations

-- First, let's create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the authenticated user is in the users table with admin role
    -- OR if they're in the admins table
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
        AND verified = true
    ) OR EXISTS (
        SELECT 1 FROM admins 
        WHERE id = auth.uid() 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Create comprehensive admin policies for users
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all users" ON users FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- ANNOUNCEMENTS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;

-- Create comprehensive admin policies for announcements
CREATE POLICY "Admins can view all announcements" ON announcements FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all announcements" ON announcements FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all announcements" ON announcements FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert announcements" ON announcements FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- ANNOUNCEMENT_PARTICIPANTS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all announcement participants" ON announcement_participants;
DROP POLICY IF EXISTS "Admins can update all announcement participants" ON announcement_participants;
DROP POLICY IF EXISTS "Admins can delete all announcement participants" ON announcement_participants;
DROP POLICY IF EXISTS "Admins can insert announcement participants" ON announcement_participants;

-- Create comprehensive admin policies for announcement participants
CREATE POLICY "Admins can view all announcement participants" ON announcement_participants FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all announcement participants" ON announcement_participants FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all announcement participants" ON announcement_participants FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert announcement participants" ON announcement_participants FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- RIDES TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all rides" ON rides;
DROP POLICY IF EXISTS "Admins can update all rides" ON rides;
DROP POLICY IF EXISTS "Admins can delete all rides" ON rides;
DROP POLICY IF EXISTS "Admins can insert rides" ON rides;

-- Create comprehensive admin policies for rides
CREATE POLICY "Admins can view all rides" ON rides FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all rides" ON rides FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all rides" ON rides FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert rides" ON rides FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- RIDE_SHARES TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all ride shares" ON ride_shares;
DROP POLICY IF EXISTS "Admins can update all ride shares" ON ride_shares;
DROP POLICY IF EXISTS "Admins can delete all ride shares" ON ride_shares;
DROP POLICY IF EXISTS "Admins can insert ride shares" ON ride_shares;

-- Create comprehensive admin policies for ride shares
CREATE POLICY "Admins can view all ride shares" ON ride_shares FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all ride shares" ON ride_shares FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all ride shares" ON ride_shares FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert ride shares" ON ride_shares FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- REVIEW_DETAILS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all review details" ON review_details;
DROP POLICY IF EXISTS "Admins can update all review details" ON review_details;
DROP POLICY IF EXISTS "Admins can delete all review details" ON review_details;
DROP POLICY IF EXISTS "Admins can insert review details" ON review_details;

-- Create comprehensive admin policies for review details
CREATE POLICY "Admins can view all review details" ON review_details FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all review details" ON review_details FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all review details" ON review_details FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert review details" ON review_details FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- RATINGS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all ratings" ON ratings;
DROP POLICY IF EXISTS "Admins can update all ratings" ON ratings;
DROP POLICY IF EXISTS "Admins can delete all ratings" ON ratings;
DROP POLICY IF EXISTS "Admins can insert ratings" ON ratings;

-- Create comprehensive admin policies for ratings
CREATE POLICY "Admins can view all ratings" ON ratings FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all ratings" ON ratings FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all ratings" ON ratings FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert ratings" ON ratings FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- REVIEWS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can update all reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can delete all reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can insert reviews" ON reviews;

-- Create comprehensive admin policies for reviews
CREATE POLICY "Admins can view all reviews" ON reviews FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all reviews" ON reviews FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all reviews" ON reviews FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert reviews" ON reviews FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- NOTIFICATIONS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can update all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;

-- Create comprehensive admin policies for notifications
CREATE POLICY "Admins can view all notifications" ON notifications FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all notifications" ON notifications FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all notifications" ON notifications FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert notifications" ON notifications FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- CONNECTION_REQUESTS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Admins can update all connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Admins can delete all connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Admins can insert connection requests" ON connection_requests;

-- Create comprehensive admin policies for connection requests
CREATE POLICY "Admins can view all connection requests" ON connection_requests FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all connection requests" ON connection_requests FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all connection requests" ON connection_requests FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert connection requests" ON connection_requests FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- FAVORITE_ROUTES TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all favorite routes" ON favorite_routes;
DROP POLICY IF EXISTS "Admins can update all favorite routes" ON favorite_routes;
DROP POLICY IF EXISTS "Admins can delete all favorite routes" ON favorite_routes;
DROP POLICY IF EXISTS "Admins can insert favorite routes" ON favorite_routes;

-- Create comprehensive admin policies for favorite routes
CREATE POLICY "Admins can view all favorite routes" ON favorite_routes FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all favorite routes" ON favorite_routes FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all favorite routes" ON favorite_routes FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert favorite routes" ON favorite_routes FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- PAYMENTS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON payments;
DROP POLICY IF EXISTS "Admins can delete all payments" ON payments;
DROP POLICY IF EXISTS "Admins can insert payments" ON payments;

-- Create comprehensive admin policies for payments
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all payments" ON payments FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all payments" ON payments FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert payments" ON payments FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- PREFERRED_LOCATIONS TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all preferred locations" ON preferred_locations;
DROP POLICY IF EXISTS "Admins can update all preferred locations" ON preferred_locations;
DROP POLICY IF EXISTS "Admins can delete all preferred locations" ON preferred_locations;
DROP POLICY IF EXISTS "Admins can insert preferred locations" ON preferred_locations;

-- Create comprehensive admin policies for preferred locations
CREATE POLICY "Admins can view all preferred locations" ON preferred_locations FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all preferred locations" ON preferred_locations FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all preferred locations" ON preferred_locations FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert preferred locations" ON preferred_locations FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- PREFERRED_TRAVEL_PLACES TABLE - Admin Policies
-- ============================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all preferred travel places" ON preferred_travel_places;
DROP POLICY IF EXISTS "Admins can update all preferred travel places" ON preferred_travel_places;
DROP POLICY IF EXISTS "Admins can delete all preferred travel places" ON preferred_travel_places;
DROP POLICY IF EXISTS "Admins can insert preferred travel places" ON preferred_travel_places;

-- Create comprehensive admin policies for preferred travel places
CREATE POLICY "Admins can view all preferred travel places" ON preferred_travel_places FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all preferred travel places" ON preferred_travel_places FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all preferred travel places" ON preferred_travel_places FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert preferred travel places" ON preferred_travel_places FOR INSERT WITH CHECK (is_admin_user());

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

-- Grant necessary permissions for the admin function
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated, anon;

-- Enable RLS on all tables if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_travel_places ENABLE ROW LEVEL SECURITY;

SELECT 'Admin RLS policies have been successfully applied to all tables' as status;
