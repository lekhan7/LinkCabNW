-- Create the get_reviewable_users function
-- This function returns users that can be reviewed for a specific announcement

CREATE OR REPLACE FUNCTION get_reviewable_users(
    announcement_uuid UUID,
    current_user_uuid UUID
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    completion_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Return users that can be reviewed:
    -- 1. For creators: return accepted participants who have completed the ride
    -- 2. For participants: return the creator if they have completed the ride
    -- 3. Don't return the current user
    -- 4. Only return users where the ride is completed
    
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        CASE 
            WHEN a.created_by = current_user_uuid THEN 'participant'
            ELSE 'creator'
        END as completion_type
    FROM users u
    JOIN announcements a ON (
        -- For creators: get participants
        (a.created_by = current_user_uuid AND u.id IN (
            SELECT DISTINCT user_id 
            FROM ride_participants 
            WHERE announcement_id = announcement_uuid 
            AND status = 'accepted'
        )) OR
        -- For participants: get creator
        (a.created_by != current_user_uuid AND u.id = a.created_by AND current_user_uuid IN (
            SELECT DISTINCT user_id 
            FROM ride_participants 
            WHERE announcement_id = announcement_uuid 
            AND status = 'accepted'
        ))
    )
    WHERE a.id = announcement_uuid
    AND a.ride_completed = true
    AND u.id != current_user_uuid
    AND EXISTS (
        SELECT 1 FROM ride_participants rp 
        WHERE rp.announcement_id = announcement_uuid 
        AND rp.status = 'accepted'
    );
    
    -- If no completed ride found, return empty result
    IF NOT FOUND THEN
        RETURN;
    END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_reviewable_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_reviewable_users TO service_role;
