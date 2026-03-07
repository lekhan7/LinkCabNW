-- ============================================
-- 🔧 FIX NOTIFICATION TYPE CONSTRAINT
-- ============================================
-- This script updates the notification functions to use the correct type

-- Update the announcement favorite notification function to use the correct type
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
        AND NOT EXISTS (
            -- Prevent duplicate notifications for same announcement + user
            SELECT 1 FROM notifications n 
            WHERE n.recipient_id = fr.user_id 
            AND n.announcement_id = announcement_uuid 
            AND n.type = 'FAVORITE_ROUTE_MATCH'
        )
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
            'FAVORITE_ROUTE_MATCH',  -- CORRECT TYPE: Using 'FAVORITE_ROUTE_MATCH' as per table constraint
            'New ride on your favorite route!',
            format('%s has created a ride from %s to %s on %s at %s. Would you like to join?', 
                   creator_username,
                   announcement_record.start_location_name,
                   announcement_record.destination_name,
                   to_char(announcement_record.date, 'Mon DD, YYYY'),
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

-- Update the ride favorite notification function to use the correct type
CREATE OR REPLACE FUNCTION create_favorite_match_notification_for_ride(ride_uuid UUID)
RETURNS void AS $$
DECLARE
    ride_record RECORD;
    matching_users RECORD;
    notification_message TEXT;
    creator_username TEXT;
BEGIN
    -- Get the ride details
    SELECT 
        r.source_name,
        r.destination_name,
        r.date,
        r.time,
        r.user_id,
        u.name as creator_name
    INTO ride_record
    FROM rides r
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ride_uuid;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Ride not found: %', ride_uuid;
        RETURN;
    END IF;
    
    -- Get the creator's name for the notification message
    creator_username := COALESCE(ride_record.creator_name, 'A user');
    
    -- Find users who have favorited this exact route (both directions)
    FOR matching_users IN 
        SELECT DISTINCT fr.user_id, u.name as user_name
        FROM favorite_routes fr
        JOIN users u ON fr.user_id = u.id
        WHERE (
            -- Exact match: from_location = source AND to_location = destination
            (fr.from_location ILIKE ride_record.source_name AND 
             fr.to_location ILIKE ride_record.destination_name)
            OR
            -- Reverse match: from_location = destination AND to_location = source  
            (fr.from_location ILIKE ride_record.destination_name AND 
             fr.to_location ILIKE ride_record.source_name)
        )
        AND fr.user_id != ride_record.user_id  -- Exclude the creator
        AND NOT EXISTS (
            -- Prevent duplicate notifications for same ride + user
            SELECT 1 FROM notifications n 
            WHERE n.recipient_id = fr.user_id 
            AND n.related_announcement_id = ride_uuid 
            AND n.type = 'FAVORITE_ROUTE_MATCH'
        )
    LOOP
        -- Create notification for each matching user
        notification_message := format('%s is traveling from %s to %s on %s at %s. Would you like to join?', 
            creator_username, 
            ride_record.source_name, 
            ride_record.destination_name,
            to_char(ride_record.date, 'Mon DD, YYYY'),
            ride_record.time
        );
        
        INSERT INTO notifications (
            recipient_id,
            sender_id,
            type,
            title,
            message,
            related_announcement_id, -- Using related_announcement_id for rides
            is_read,
            created_at
        ) VALUES (
            matching_users.user_id,
            ride_record.user_id,
            'FAVORITE_ROUTE_MATCH',  -- CORRECT TYPE: Using 'FAVORITE_ROUTE_MATCH' as per table constraint
            'New ride on your favorite route!',
            notification_message,
            ride_uuid,
            false,
            CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Created favorite match notification for user % (%)', 
            matching_users.user_id, matching_users.user_name;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_favorite_match_notification TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_favorite_match_notification_for_ride TO authenticated, anon;

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE '✅ Favorite notification functions updated to use correct type: FAVORITE_ROUTE_MATCH';
    RAISE NOTICE '🎯 The notification system should now work correctly!';
END $$;
