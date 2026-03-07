-- ============================================
-- 🔥 FIX NOTIFICATION FUNCTION TYPE ERRORS
-- ============================================
-- Run this script to fix the type mismatch errors in the notification system

-- Drop and recreate the get_user_notifications function with correct types
DROP FUNCTION IF EXISTS get_user_notifications CASCADE;

-- Function to get user notifications with action buttons (FIXED VERSION)
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_filter_unread BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    sender_name TEXT,
    type TEXT,
    title TEXT,
    message TEXT,
    announcement_id UUID,
    request_id UUID,
    related_user_phone TEXT,
    status TEXT,
    is_read BOOLEAN,
    read_at TIMESTAMP,
    created_at TIMESTAMP,
    whatsapp_url TEXT,
    can_accept BOOLEAN,
    can_reject BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.sender_id,
        COALESCE(u.name, 'Unknown User') as sender_name,
        n.type,
        n.title,
        n.message,
        n.announcement_id,
        n.request_id,
        n.related_user_phone,
        n.status,
        n.is_read,
        n.read_at,
        n.created_at,
        CASE 
            WHEN n.type = 'join_accepted' AND n.related_user_phone IS NOT NULL 
            THEN format('https://wa.me/%s?text=Hi, my request was accepted for the ride.', REPLACE(n.related_user_phone, '+', ''))
            ELSE NULL
        END as whatsapp_url,
        CASE 
            WHEN n.type = 'join_request' AND n.request_id IS NOT NULL 
            THEN TRUE
            ELSE FALSE
        END as can_accept,
        CASE 
            WHEN n.type = 'join_request' AND n.request_id IS NOT NULL 
            THEN TRUE
            ELSE FALSE
        END as can_reject
    FROM notifications n
    LEFT JOIN users u ON n.sender_id = u.id
    WHERE n.recipient_id = p_user_id
        AND (p_filter_unread = FALSE OR n.is_read = FALSE)
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_notifications TO authenticated, anon;

-- ============================================
-- VERIFICATION
-- ============================================
-- Test the function to make sure it works
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Test with a sample user ID (this will return empty if user doesn't exist)
    FOR test_result IN 
        SELECT * FROM get_user_notifications('00000000-0000-0000-0000-000000000000'::UUID, 1, 0, false)
        LIMIT 1
    LOOP
        RAISE NOTICE '✅ Function works correctly!';
        RETURN;
    END LOOP;
    
    RAISE NOTICE '✅ Function created successfully (no test data found)';
END $$;

-- ============================================
-- COMPLETION
-- ============================================
-- The notification function should now work without type errors
-- You can test it with: SELECT * FROM get_user_notifications('your-user-id', 10, 0, false);
