-- Create the missing function for announcement favorite match notifications
CREATE OR REPLACE FUNCTION create_favorite_match_notification(announcement_uuid UUID)
RETURNS void AS $$
DECLARE
    announcement_record RECORD;
    matching_users RECORD;
    notification_message TEXT;
    creator_username TEXT;
BEGIN
    -- Get the announcement details
    SELECT 
        a.start_location_name,
        a.destination_name,
        a.date,
        a.time,
        a.created_by,
        u.name as creator_name
    INTO announcement_record
    FROM announcements a
    JOIN users u ON a.created_by = u.id
    WHERE a.id = announcement_uuid;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Announcement not found: %', announcement_uuid;
        RETURN;
    END IF;
    
    -- Get the creator's name for the notification message
    creator_username := COALESCE(announcement_record.creator_name, 'A user');
    
    -- Find users who have favorited this route (in either direction)
    FOR matching_users IN 
        SELECT DISTINCT 
            fr.user_id,
            u.name as user_name,
            u.email
        FROM favorite_routes fr
        JOIN users u ON fr.user_id = u.id
        WHERE (
            -- Exact match
            (fr.from_location ILIKE announcement_record.start_location_name AND 
             fr.to_location ILIKE announcement_record.destination_name) OR
            -- Reverse match (for bidirectional matching)
            (fr.from_location ILIKE announcement_record.destination_name AND 
             fr.to_location ILIKE announcement_record.start_location_name) OR
            -- Partial matches
            (fr.from_location ILIKE '%' || announcement_record.start_location_name || '%' AND 
             fr.to_location ILIKE '%' || announcement_record.destination_name || '%') OR
            (fr.from_location ILIKE '%' || announcement_record.destination_name || '%' AND 
             fr.to_location ILIKE '%' || announcement_record.start_location_name || '%')
        )
        AND fr.user_id != announcement_record.created_by  -- Don't notify the creator
    LOOP
        -- Create notification for each matching user
        INSERT INTO notifications (
            recipient_id,
            sender_id,
            type,
            title,
            message,
            announcement_id,
            related_announcement_id,
            is_read,
            created_at
        ) VALUES (
            matching_users.user_id,
            announcement_record.created_by,
            'FAVORITE_ROUTE_MATCH',
            'New ride on your favorite route!',
            format('%s has created a ride from %s to %s on %s at %s', 
                   creator_username,
                   announcement_record.start_location_name,
                   announcement_record.destination_name,
                   announcement_record.date,
                   announcement_record.time),
            announcement_uuid,
            announcement_uuid,
            false,
            CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Created favorite match notification for user % (%)', 
            matching_users.user_id, matching_users.user_name;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_favorite_match_notification TO authenticated, anon;
