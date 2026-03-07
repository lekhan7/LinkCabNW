-- Create the submit_report function
-- This function submits a report against a user

CREATE OR REPLACE FUNCTION submit_report(
    ride_uuid UUID,
    reporter_uuid UUID,
    reported_user_uuid UUID,
    report_reason TEXT,
    report_description TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ride_exists BOOLEAN;
    participant_exists BOOLEAN;
    already_reported BOOLEAN;
BEGIN
    -- Check if the ride exists
    SELECT EXISTS(
        SELECT 1 FROM announcements 
        WHERE id = ride_uuid
    ) INTO ride_exists;
    
    IF NOT ride_exists THEN
        RETURN QUERY SELECT false, 'Ride not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if reporter is a participant and reported user is involved in the ride
    SELECT EXISTS(
        SELECT 1 FROM announcement_participants ap
        JOIN announcements a ON ap.announcement_id = a.id
        WHERE ap.announcement_id = ride_uuid 
        AND ap.user_id = reporter_uuid 
        AND ap.status = 'accepted'
        AND (
            -- Reporter is creator and reported user is participant
            (a.created_by = reporter_uuid AND ap.user_id = reported_user_uuid) OR
            -- Reporter is participant and reported user is creator
            (a.created_by = reported_user_uuid AND ap.user_id = reporter_uuid)
        )
    ) INTO participant_exists;
    
    IF NOT participant_exists THEN
        RETURN QUERY SELECT false, 'You are not authorized to report this user for this ride'::TEXT;
        RETURN;
    END IF;
    
    -- Check if report already exists for this ride
    SELECT EXISTS(
        SELECT 1 FROM reports 
        WHERE announcement_id = ride_uuid 
        AND reporter_id = reporter_uuid 
        AND reported_user_id = reported_user_uuid
    ) INTO already_reported;
    
    IF already_reported THEN
        RETURN QUERY SELECT false, 'You have already reported this user for this ride'::TEXT;
        RETURN;
    END IF;
    
    -- Insert the report
    INSERT INTO reports (
        announcement_id, 
        reporter_id, 
        reported_user_id, 
        report_reason, 
        report_description, 
        created_at
    ) VALUES (
        ride_uuid, 
        reporter_uuid, 
        reported_user_uuid, 
        report_reason, 
        report_description, 
        NOW()
    );
    
    RETURN QUERY SELECT true, 'Report submitted successfully'::TEXT;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION submit_report TO authenticated;
GRANT EXECUTE ON FUNCTION submit_report TO service_role;
