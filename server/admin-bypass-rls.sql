-- ============================================
-- ADMIN BYPASS RLS POLICIES
-- ============================================
-- This script creates admin policies that bypass normal RLS restrictions
-- allowing admins to perform any operation on any data

-- First, ensure we have the admin check function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the authenticated user is in the users table with admin role
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
        AND verified = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated, anon;

-- ============================================
-- BYPASS POLICIES FOR ADMIN OPERATIONS
-- ============================================

-- USERS TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass users select" ON users;
DROP POLICY IF EXISTS "Admin bypass users update" ON users;
DROP POLICY IF EXISTS "Admin bypass users delete" ON users;
DROP POLICY IF EXISTS "Admin bypass users insert" ON users;

CREATE POLICY "Admin bypass users select" ON users FOR SELECT USING (is_admin_user() OR id = auth.uid());
CREATE POLICY "Admin bypass users update" ON users FOR UPDATE USING (is_admin_user() OR id = auth.uid());
CREATE POLICY "Admin bypass users delete" ON users FOR DELETE USING (is_admin_user() OR id = auth.uid());
CREATE POLICY "Admin bypass users insert" ON users FOR INSERT WITH CHECK (is_admin_user() OR id = auth.uid());

-- ANNOUNCEMENTS TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass announcements select" ON announcements;
DROP POLICY IF EXISTS "Admin bypass announcements update" ON announcements;
DROP POLICY IF EXISTS "Admin bypass announcements delete" ON announcements;
DROP POLICY IF EXISTS "Admin bypass announcements insert" ON announcements;

CREATE POLICY "Admin bypass announcements select" ON announcements FOR SELECT USING (is_admin_user() OR created_by = auth.uid());
CREATE POLICY "Admin bypass announcements update" ON announcements FOR UPDATE USING (is_admin_user() OR created_by = auth.uid());
CREATE POLICY "Admin bypass announcements delete" ON announcements FOR DELETE USING (is_admin_user() OR created_by = auth.uid());
CREATE POLICY "Admin bypass announcements insert" ON announcements FOR INSERT WITH CHECK (is_admin_user() OR created_by = auth.uid());

-- ANNOUNCEMENT_PARTICIPANTS TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass announcement_participants select" ON announcement_participants;
DROP POLICY IF EXISTS "Admin bypass announcement_participants update" ON announcement_participants;
DROP POLICY IF EXISTS "Admin bypass announcement_participants delete" ON announcement_participants;
DROP POLICY IF EXISTS "Admin bypass announcement_participants insert" ON announcement_participants;

CREATE POLICY "Admin bypass announcement_participants select" ON announcement_participants FOR SELECT USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass announcement_participants update" ON announcement_participants FOR UPDATE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass announcement_participants delete" ON announcement_participants FOR DELETE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass announcement_participants insert" ON announcement_participants FOR INSERT WITH CHECK (is_admin_user() OR user_id = auth.uid());

-- REVIEW_DETAILS TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass review_details select" ON review_details;
DROP POLICY IF EXISTS "Admin bypass review_details update" ON review_details;
DROP POLICY IF EXISTS "Admin bypass review_details delete" ON review_details;
DROP POLICY IF EXISTS "Admin bypass review_details insert" ON review_details;

CREATE POLICY "Admin bypass review_details select" ON review_details FOR SELECT USING (is_admin_user() OR user_id = auth.uid() OR reviewee_id = auth.uid());
CREATE POLICY "Admin bypass review_details update" ON review_details FOR UPDATE USING (is_admin_user() OR user_id = auth.uid() OR reviewee_id = auth.uid());
CREATE POLICY "Admin bypass review_details delete" ON review_details FOR DELETE USING (is_admin_user() OR user_id = auth.uid() OR reviewee_id = auth.uid());
CREATE POLICY "Admin bypass review_details insert" ON review_details FOR INSERT WITH CHECK (is_admin_user() OR user_id = auth.uid() OR reviewee_id = auth.uid());

-- RIDES TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass rides select" ON rides;
DROP POLICY IF EXISTS "Admin bypass rides update" ON rides;
DROP POLICY IF EXISTS "Admin bypass rides delete" ON rides;
DROP POLICY IF EXISTS "Admin bypass rides insert" ON rides;

CREATE POLICY "Admin bypass rides select" ON rides FOR SELECT USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass rides update" ON rides FOR UPDATE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass rides delete" ON rides FOR DELETE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass rides insert" ON rides FOR INSERT WITH CHECK (is_admin_user() OR user_id = auth.uid());

-- RIDE_SHARES TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass ride_shares select" ON ride_shares;
DROP POLICY IF EXISTS "Admin bypass ride_shares update" ON ride_shares;
DROP POLICY IF EXISTS "Admin bypass ride_shares delete" ON ride_shares;
DROP POLICY IF EXISTS "Admin bypass ride_shares insert" ON ride_shares;

CREATE POLICY "Admin bypass ride_shares select" ON ride_shares FOR SELECT USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass ride_shares update" ON ride_shares FOR UPDATE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass ride_shares delete" ON ride_shares FOR DELETE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass ride_shares insert" ON ride_shares FOR INSERT WITH CHECK (is_admin_user() OR user_id = auth.uid());

-- RATINGS TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass ratings select" ON ratings;
DROP POLICY IF EXISTS "Admin bypass ratings update" ON ratings;
DROP POLICY IF EXISTS "Admin bypass ratings delete" ON ratings;
DROP POLICY IF EXISTS "Admin bypass ratings insert" ON ratings;

CREATE POLICY "Admin bypass ratings select" ON ratings FOR SELECT USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass ratings update" ON ratings FOR UPDATE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass ratings delete" ON ratings FOR DELETE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass ratings insert" ON ratings FOR INSERT WITH CHECK (is_admin_user() OR user_id = auth.uid());

-- NOTIFICATIONS TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass notifications select" ON notifications;
DROP POLICY IF EXISTS "Admin bypass notifications update" ON notifications;
DROP POLICY IF EXISTS "Admin bypass notifications delete" ON notifications;
DROP POLICY IF EXISTS "Admin bypass notifications insert" ON notifications;

CREATE POLICY "Admin bypass notifications select" ON notifications FOR SELECT USING (is_admin_user() OR recipient_id = auth.uid() OR sender_id = auth.uid());
CREATE POLICY "Admin bypass notifications update" ON notifications FOR UPDATE USING (is_admin_user() OR recipient_id = auth.uid() OR sender_id = auth.uid());
CREATE POLICY "Admin bypass notifications delete" ON notifications FOR DELETE USING (is_admin_user() OR recipient_id = auth.uid() OR sender_id = auth.uid());
CREATE POLICY "Admin bypass notifications insert" ON notifications FOR INSERT WITH CHECK (is_admin_user() OR recipient_id = auth.uid() OR sender_id = auth.uid());

-- CONNECTION_REQUESTS TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass connection_requests select" ON connection_requests;
DROP POLICY IF EXISTS "Admin bypass connection_requests update" ON connection_requests;
DROP POLICY IF EXISTS "Admin bypass connection_requests delete" ON connection_requests;
DROP POLICY IF EXISTS "Admin bypass connection_requests insert" ON connection_requests;

CREATE POLICY "Admin bypass connection_requests select" ON connection_requests FOR SELECT USING (is_admin_user() OR requester_id = auth.uid() OR requested_id = auth.uid());
CREATE POLICY "Admin bypass connection_requests update" ON connection_requests FOR UPDATE USING (is_admin_user() OR requester_id = auth.uid() OR requested_id = auth.uid());
CREATE POLICY "Admin bypass connection_requests delete" ON connection_requests FOR DELETE USING (is_admin_user() OR requester_id = auth.uid() OR requested_id = auth.uid());
CREATE POLICY "Admin bypass connection_requests insert" ON connection_requests FOR INSERT WITH CHECK (is_admin_user() OR requester_id = auth.uid() OR requested_id = auth.uid());

-- FAVORITE_ROUTES TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass favorite_routes select" ON favorite_routes;
DROP POLICY IF EXISTS "Admin bypass favorite_routes update" ON favorite_routes;
DROP POLICY IF EXISTS "Admin bypass favorite_routes delete" ON favorite_routes;
DROP POLICY IF EXISTS "Admin bypass favorite_routes insert" ON favorite_routes;

CREATE POLICY "Admin bypass favorite_routes select" ON favorite_routes FOR SELECT USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass favorite_routes update" ON favorite_routes FOR UPDATE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass favorite_routes delete" ON favorite_routes FOR DELETE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass favorite_routes insert" ON favorite_routes FOR INSERT WITH CHECK (is_admin_user() OR user_id = auth.uid());

-- PAYMENTS TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass payments select" ON payments;
DROP POLICY IF EXISTS "Admin bypass payments update" ON payments;
DROP POLICY IF EXISTS "Admin bypass payments delete" ON payments;
DROP POLICY IF EXISTS "Admin bypass payments insert" ON payments;

CREATE POLICY "Admin bypass payments select" ON payments FOR SELECT USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass payments update" ON payments FOR UPDATE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass payments delete" ON payments FOR DELETE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass payments insert" ON payments FOR INSERT WITH CHECK (is_admin_user() OR user_id = auth.uid());

-- PREFERRED_LOCATIONS TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass preferred_locations select" ON preferred_locations;
DROP POLICY IF EXISTS "Admin bypass preferred_locations update" ON preferred_locations;
DROP POLICY IF EXISTS "Admin bypass preferred_locations delete" ON preferred_locations;
DROP POLICY IF EXISTS "Admin bypass preferred_locations insert" ON preferred_locations;

CREATE POLICY "Admin bypass preferred_locations select" ON preferred_locations FOR SELECT USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass preferred_locations update" ON preferred_locations FOR UPDATE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass preferred_locations delete" ON preferred_locations FOR DELETE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass preferred_locations insert" ON preferred_locations FOR INSERT WITH CHECK (is_admin_user() OR user_id = auth.uid());

-- PREFERRED_TRAVEL_PLACES TABLE - Admin Bypass Policies
DROP POLICY IF EXISTS "Admin bypass preferred_travel_places select" ON preferred_travel_places;
DROP POLICY IF EXISTS "Admin bypass preferred_travel_places update" ON preferred_travel_places;
DROP POLICY IF EXISTS "Admin bypass preferred_travel_places delete" ON preferred_travel_places;
DROP POLICY IF EXISTS "Admin bypass preferred_travel_places insert" ON preferred_travel_places;

CREATE POLICY "Admin bypass preferred_travel_places select" ON preferred_travel_places FOR SELECT USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass preferred_travel_places update" ON preferred_travel_places FOR UPDATE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass preferred_travel_places delete" ON preferred_travel_places FOR DELETE USING (is_admin_user() OR user_id = auth.uid());
CREATE POLICY "Admin bypass preferred_travel_places insert" ON preferred_travel_places FOR INSERT WITH CHECK (is_admin_user() OR user_id = auth.uid());

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

SELECT 'Admin bypass RLS policies have been successfully applied' as status;
