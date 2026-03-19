-- ================================================================
-- COMPREHENSIVE RLS AND FUNCTION FIXES
-- ================================================================

-- 1. DISABLE RLS ON ALL PROBLEMATIC TABLES
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants DISABLE ROW LEVEL SECURITY;

-- 2. DROP CONFLICTING FUNCTIONS
DROP FUNCTION IF EXISTS get_user_notifications CASCADE;

-- 3. RECREATE FUNCTION WITH CORRECT PARAMETER ORDER
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID, 
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_filter_unread BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    announcement_id UUID,
    request_id UUID,
    related_user_phone VARCHAR(20),
    status VARCHAR(50),
    is_read BOOLEAN,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.sender_id,
        n.type,
        n.title,
        n.message,
        n.announcement_id,
        n.request_id,
        n.related_user_phone,
        n.status,
        n.is_read,
        n.read_at,
        n.created_at
    FROM notifications n
    WHERE n.recipient_id = p_user_id
        AND (NOT p_filter_unread OR n.is_read = false)
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE SIMPLE POLICIES FOR TABLES THAT NEED RLS
-- Announcements - allow all operations for now
CREATE POLICY "Allow all on announcements" ON announcements
    FOR ALL USING (true);

-- Notifications - allow all operations for now
CREATE POLICY "Allow all on notifications" ON notifications
    FOR ALL USING (true);

-- Favorite routes - allow all operations for now
CREATE POLICY "Allow all on favorite_routes" ON favorite_routes
    FOR ALL USING (true);

-- Announcement participants - allow all operations for now
CREATE POLICY "Allow all on announcement_participants" ON announcement_participants
    FOR ALL USING (true);

-- 5. RE-ENABLE RLS WITH SIMPLE POLICIES
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants ENABLE ROW LEVEL SECURITY;

-- 6. FIX MISSING mark_notification_read FUNCTION
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    UPDATE notifications 
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = p_notification_id AND recipient_id = p_user_id;
    
    result := json_build_object(
        'success', true,
        'message', 'Notification marked as read'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
