-- ============================================
-- 🔥 SIMPLE SOCKET.IO NOTIFICATION SYSTEM
-- ============================================
-- Clean, simple notification system using Socket.IO

-- Drop all existing notification tables and functions
DROP TABLE IF EXISTS notifications CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS update_participant_status CASCADE;
DROP FUNCTION IF EXISTS get_user_notifications CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;

-- Simple notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES users(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    announcement_id UUID REFERENCES announcements(id),
    request_id UUID REFERENCES announcement_participants(id),
    related_user_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simple indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

-- Simple create notification function
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_id UUID,
    p_sender_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_announcement_id UUID DEFAULT NULL,
    p_request_id UUID DEFAULT NULL,
    p_related_user_phone VARCHAR(20) DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'pending'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Create the notification
    INSERT INTO notifications (
        recipient_id, sender_id, type, title, message, 
        announcement_id, request_id, related_user_phone, status
    ) VALUES (
        p_recipient_id, p_sender_id, p_type, p_title, p_message,
        p_announcement_id, p_request_id, p_related_user_phone, p_status
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple participant status update function
CREATE OR REPLACE FUNCTION update_participant_status(
    p_participant_id UUID,
    p_new_status VARCHAR(20),
    p_current_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_participant RECORD;
    v_creator_phone VARCHAR(20);
    v_notification_id UUID;
    v_updated_participant RECORD;
BEGIN
    -- Get participant details
    SELECT 
        ap.id,
        ap.user_id as participant_user_id,
        ap.announcement_id,
        u.name as participant_name,
        a.created_by,
        a.start_location_name,
        a.destination_name
    INTO v_participant
    FROM announcement_participants ap
    JOIN users u ON ap.user_id = u.id
    JOIN announcements a ON ap.announcement_id = a.id
    WHERE ap.id = p_participant_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Participant not found');
    END IF;
    
    -- Check if the current user is the announcement creator
    IF v_participant.created_by != p_current_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Only the announcement creator can update participant status');
    END IF;
    
    -- Get creator's phone number
    SELECT phone_number INTO v_creator_phone
    FROM users
    WHERE id = v_participant.created_by;
    
    -- Update participant status
    UPDATE announcement_participants 
    SET status = p_new_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_participant_id
    RETURNING * INTO v_updated_participant;
    
    -- Create notification for the PASSENGER
    IF p_new_status = 'accepted' THEN
        v_notification_id := create_notification(
            v_participant.participant_user_id,  -- Send to PASSENGER
            p_current_user_id,                 -- From creator
            'join_accepted',
            'Join Request Accepted! 🎉',
            format('Great news! Your request to join the ride from %s to %s has been accepted. Contact the rider on WhatsApp to coordinate pickup details.', 
                   v_participant.start_location_name, v_participant.destination_name),
            v_participant.announcement_id,
            p_participant_id,
            v_creator_phone,
            'accepted'
        );
        
    ELSIF p_new_status = 'rejected' THEN
        v_notification_id := create_notification(
            v_participant.participant_user_id,  -- Send to PASSENGER
            p_current_user_id,                 -- From creator
            'join_rejected',
            'Join Request Rejected',
            format('Your request to join the ride from %s to %s was not accepted. Don\'t worry - check out other available rides!', 
                   v_participant.start_location_name, v_participant.destination_name),
            v_participant.announcement_id,
            p_participant_id,
            NULL,
            'rejected'
        );
    END IF;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'participant_updated', v_updated_participant,
        'notification_id', v_notification_id,
        'message', format('Request %s and notification sent to passenger', p_new_status)
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple get notifications function
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_filter_unread BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    sender_name VARCHAR,
    type VARCHAR,
    title VARCHAR,
    message TEXT,
    announcement_id UUID,
    request_id UUID,
    related_user_phone VARCHAR,
    status VARCHAR,
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
        COALESCE(u.name, '') as sender_name,
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

-- Simple mark as read function
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE id = p_notification_id 
        AND recipient_id = p_user_id
        AND is_read = FALSE;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
        RETURN json_build_object('success', true, 'message', 'Notification marked as read');
    ELSE
        RETURN json_build_object('success', false, 'message', 'Notification not found or already read');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_participant_status TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_notifications TO authenticated, anon;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated, anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ SIMPLE SOCKET.IO NOTIFICATION SYSTEM CREATED!';
    RAISE NOTICE '✅ Notifications will go to passengers when accepted/rejected';
    RAISE NOTICE '✅ Use Socket.IO for real-time updates';
END $$;
