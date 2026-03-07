-- Enhanced RLS Policies for Announcements Table
-- This file creates comprehensive Row Level Security policies for announcements
-- Handles: Admin full access, Creator restrictions, and User deletion rights

-- First, ensure RLS is enabled
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing announcement policies if they exist
DROP POLICY IF EXISTS "Admin full access to announcements" ON announcements;
DROP POLICY IF EXISTS "Users view all announcements" ON announcements;
DROP POLICY IF EXISTS "Users create announcements" ON announcements;
DROP POLICY IF EXISTS "Users update own announcements" ON announcements;
DROP POLICY IF EXISTS "Users delete own announcements" ON announcements;

-- Helper functions for better policy management
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

CREATE OR REPLACE FUNCTION is_creator(announcement_id uuid) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM announcements 
    WHERE id = announcement_id 
    AND created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION has_co_passengers(announcement_id uuid) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM announcement_participants 
    WHERE announcement_id = announcement_id 
    AND status = 'accepted'
  );
$$;

CREATE OR REPLACE FUNCTION is_in_favorites(announcement_id uuid) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM favorite_routes 
    WHERE announcement_id = announcement_id 
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION has_notification_reference(announcement_id uuid) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM notifications 
    WHERE announcement_id = announcement_id 
    AND recipient_id = auth.uid()
  );
$$;

-- ============================================
-- MAIN ANNOUNCEMENT RLS POLICIES
-- ============================================

-- 1. Admin can do ANYTHING to announcements
CREATE POLICY "Admin full access to announcements" ON announcements
    FOR ALL USING (
        is_admin()
    );

-- 2. Users can view all non-completed announcements (public access)
CREATE POLICY "Users view active announcements" ON announcements
    FOR SELECT USING (
        ride_completed = false
    );

-- 3. Users can create announcements
CREATE POLICY "Users create announcements" ON announcements
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
    );

-- 4. Users can update their own announcements
CREATE POLICY "Users update own announcements" ON announcements
    FOR UPDATE USING (
        created_by = auth.uid()
    );

-- 5. Enhanced deletion policy for announcements
CREATE POLICY "Users delete announcements with restrictions" ON announcements
    FOR DELETE USING (
        -- Admin can delete any announcement
        is_admin() 
        OR
        -- Creator can delete their own announcement ONLY if no co-passengers have joined
        (
            is_creator(id) 
            AND NOT has_co_passengers(id)
        )
        OR
        -- Anyone can delete if announcement is in their favorites
        is_in_favorites(id)
        OR
        -- Anyone can delete if they have a notification reference
        has_notification_reference(id)
    );

-- ============================================
-- HELPER VIEWS FOR BETTER PERFORMANCE
-- ============================================

-- Admin view for announcements
CREATE OR REPLACE VIEW admin_announcements AS
SELECT * FROM announcements WHERE is_admin();

-- User announcements view (for dashboard)
CREATE OR REPLACE VIEW user_announcements AS
SELECT 
    a.*,
    -- Add helper fields for frontend logic
    (is_creator(a.id)) as is_creator,
    (has_co_passengers(a.id)) as has_co_passengers,
    (is_in_favorites(a.id)) as is_in_favorites,
    (has_notification_reference(a.id)) as has_notification_ref
FROM announcements a
WHERE 
    -- Users can see their own announcements
    a.created_by = auth.uid()
    OR
    -- Or all announcements if they're admin
    is_admin();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user is an admin';
COMMENT ON FUNCTION is_creator(uuid) IS 'Helper function to check if user created the announcement';
COMMENT ON FUNCTION has_co_passengers(uuid) IS 'Helper function to check if announcement has accepted co-passengers';
COMMENT ON FUNCTION is_in_favorites(uuid) IS 'Helper function to check if announcement is in user favorites';
COMMENT ON FUNCTION has_notification_reference(uuid) IS 'Helper function to check if user has notification reference';

-- Note: Policy descriptions are documented above in section comments

COMMENT ON VIEW admin_announcements IS 'Admin view of all announcements with admin access check';
COMMENT ON VIEW user_announcements IS 'User announcements view with helper fields for frontend logic';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure service role has necessary permissions for server operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant select permissions on views
GRANT SELECT ON admin_announcements TO authenticated;
GRANT SELECT ON user_announcements TO authenticated;
