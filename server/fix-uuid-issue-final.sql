-- FIX FOR UUID ERROR
-- The issue is that there are conflicting versions of create_notification function
-- One version returns UUID, another returns JSON object
-- This script ensures the correct version is deployed

-- Drop all conflicting functions
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS update_participant_status CASCADE;
DROP FUNCTION IF EXISTS get_user_notifications CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;

-- Create the correct create_notification function that returns UUID
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

-- Create the correct update_participant_status function
CREATE OR REPLACE FUNCTION update_participant_status(
    p_participant_id UUID,
    p_new_status VARCHAR,
    p_current_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    mapped_status VARCHAR(20);
    participant_record RECORD;
    user_phone VARCHAR(15);
    v_notification_id UUID;
BEGIN
    -- Map the incoming status to the correct database value
    IF p_new_status = 'accept' THEN
        mapped_status := 'accepted';
    ELSIF p_new_status = 'reject' THEN
        mapped_status := 'rejected';
    ELSE
        mapped_status := p_new_status;
    END IF;
    
    -- Validate that the mapped status is allowed
    IF mapped_status NOT IN ('requested', 'pending', 'accepted', 'rejected', 'completed') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid status: ' || mapped_status
        );
    END IF;
    
    -- Update participant status and get the updated record
    UPDATE announcement_participants 
    SET status = mapped_status 
    WHERE id = p_participant_id
    RETURNING * INTO participant_record;
    
    -- Get user phone number for notification
    SELECT phone_number INTO user_phone 
    FROM users 
    WHERE id = participant_record.user_id;
    
    -- Create notification for the requesting user (using the correct create_notification function)
    IF mapped_status = 'accepted' THEN
        v_notification_id := create_notification(
            participant_record.user_id,
            p_current_user_id,
            'join_accepted',
            'Join Request Accepted! 🎉',
            'Your ride request has been accepted! Contact the driver on WhatsApp to coordinate details.',
            participant_record.announcement_id,
            p_participant_id,
            user_phone,
            'accepted'
        );
    ELSIF mapped_status = 'rejected' THEN
        v_notification_id := create_notification(
            participant_record.user_id,
            p_current_user_id,
            'join_rejected',
            'Join Request Rejected',
            'Your ride request was not accepted. Please try other available rides.',
            participant_record.announcement_id,
            p_participant_id,
            NULL,
            'rejected'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Status updated successfully',
        'participant_updated', json_build_object(
            'id', participant_record.id,
            'user_id', participant_record.user_id,
            'status', participant_record.status,
            'phone_number', user_phone
        ),
        'notification_id', v_notification_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_participant_status TO authenticated, anon;
