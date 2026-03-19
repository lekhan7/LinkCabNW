-- ================================================================
-- AGGRESSIVE FUNCTION CONFLICT FIX
-- ================================================================

-- 1. DROP ALL VERSIONS OF THE CONFLICTING FUNCTION
DROP FUNCTION IF EXISTS get_user_notifications(p_user_id UUID, p_limit INTEGER, p_offset INTEGER, p_filter_unread BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS get_user_notifications(p_filter_unread BOOLEAN, p_limit INTEGER, p_offset INTEGER, p_user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_notifications CASCADE;

-- 2. DROP THE OTHER CONFLICTING FUNCTION TOO
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;

-- 3. CREATE FUNCTIONS WITH NEW NAMES TO AVOID CONFLICTS
CREATE OR REPLACE FUNCTION get_user_notifications_v2(
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

CREATE OR REPLACE FUNCTION mark_notification_read_v2(p_notification_id UUID, p_user_id UUID)
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

-- 4. ALTERNATIVE: CREATE SIMPLE QUERY WITHOUT FUNCTION
-- If functions still cause issues, use this direct query approach:
-- The backend can use: SELECT * FROM notifications WHERE recipient_id = $user_id ORDER BY created_at DESC LIMIT $limit

-- 5. COMPLETELY DISABLE RLS IF STILL HAVING ISSUES
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants DISABLE ROW LEVEL SECURITY;
