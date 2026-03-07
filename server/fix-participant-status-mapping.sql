-- Fix the update_participant_status function to properly map 'accept'/'reject' to 'accepted'/'rejected'
CREATE OR REPLACE FUNCTION update_participant_status(
    p_participant_id UUID,
    p_new_status VARCHAR,
    p_current_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    mapped_status VARCHAR(20);
    participant_record RECORD;
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
    DECLARE
        user_phone VARCHAR(15);
    BEGIN
        SELECT phone_number INTO user_phone 
        FROM users 
        WHERE id = participant_record.user_id;
    END;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Status updated successfully',
        'participant_updated', json_build_object(
            'id', participant_record.id,
            'user_id', participant_record.user_id,
            'status', participant_record.status,
            'phone_number', user_phone
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_participant_status TO authenticated, anon;
