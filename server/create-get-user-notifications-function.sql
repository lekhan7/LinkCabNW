-- Create missing get_user_notifications function
-- This function is needed for the notifications API to work

-- Create the function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_filter_unread BOOLEAN DEFAULT false,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    recipient_id UUID,
    sender_id UUID,
    type VARCHAR(50),
    title VARCHAR(100),
    message VARCHAR(500),
    announcement_id UUID,
    related_announcement_id UUID,
    related_chat_id UUID,
    is_read BOOLEAN,
    read_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20),
    request_id UUID,
    related_user_phone VARCHAR(15),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.recipient_id,
        n.sender_id,
        n.type,
        n.title,
        n.message,
        n.announcement_id,
        n.related_announcement_id,
        n.related_chat_id,
        n.is_read,
        n.read_at,
        n.expires_at,
        n.status,
        n.request_id,
        n.related_user_phone,
        n.created_at,
        n.updated_at
    FROM notifications n
    WHERE 
        -- Filter by user ID if provided
        (p_user_id IS NULL OR n.recipient_id = p_user_id)
        -- Filter unread if requested
        AND (NOT p_filter_unread OR n.is_read = false)
        -- Only show non-expired notifications
        AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler version for backward compatibility
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    p_filter_unread BOOLEAN DEFAULT false,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    recipient_id UUID,
    sender_id UUID,
    type VARCHAR(50),
    title VARCHAR(100),
    message VARCHAR(500),
    announcement_id UUID,
    related_announcement_id UUID,
    related_chat_id UUID,
    is_read BOOLEAN,
    read_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20),
    request_id UUID,
    related_user_phone VARCHAR(15),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.recipient_id,
        n.sender_id,
        n.type,
        n.title,
        n.message,
        n.announcement_id,
        n.related_announcement_id,
        n.related_chat_id,
        n.is_read,
        n.read_at,
        n.expires_at,
        n.status,
        n.request_id,
        n.related_user_phone,
        n.created_at,
        n.updated_at
    FROM notifications n
    WHERE 
        -- Filter by user ID if provided
        (p_user_id IS NULL OR n.recipient_id = p_user_id)
        -- Filter unread if requested
        AND (NOT p_filter_unread OR n.is_read = false)
        -- Only show non-expired notifications
        AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_notifications TO authenticated, anon;

-- Test the function
SELECT * FROM public.get_user_notifications(false, 10, 0, NULL) LIMIT 1;

SELECT '✅ get_user_notifications function created successfully' as status;
