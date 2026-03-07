-- Fix completion functions by dropping and recreating them

-- Drop existing functions that need to be updated
DROP FUNCTION IF EXISTS update_ride_completion_status CASCADE;
DROP FUNCTION IF EXISTS can_complete_ride CASCADE;

-- Enhanced completion status function - requires ALL passengers to complete AND provide feedback
CREATE OR REPLACE FUNCTION update_ride_completion_status(
    announcement_uuid UUID,
    user_uuid UUID,
    completion_type VARCHAR
) 
RETURNS JSON AS $$
DECLARE
    completion_record RECORD;
    all_participants_completed BOOLEAN;
    all_participants_reviewed BOOLEAN;
    participant_count INTEGER;
    completed_count INTEGER;
    reviewed_count INTEGER;
    result JSON;
BEGIN
    -- Insert or update completion status
    INSERT INTO announcement_completion_status (
        announcement_id, 
        user_id, 
        completed
    ) VALUES (
        announcement_uuid, 
        user_uuid, 
        true
    ) 
    ON CONFLICT (announcement_id, user_id) 
    DO UPDATE SET 
        completed = true,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Check if all participants have completed
    SELECT 
        COUNT(*) as total_participants,
        COUNT(*) FILTER (WHERE completed = true) as completed_participants
    INTO participant_count, completed_count
    FROM announcement_completion_status 
    WHERE announcement_id = announcement_uuid;
    
    all_participants_completed := (participant_count = completed_count);
    
    -- Check if all participants have provided reviews/feedback
    WITH all_possible_reviews AS (
        -- Get all possible reviewer-reviewee combinations (excluding self-reviews)
        SELECT 
            acs.user_id as reviewer_id,
            other_acs.user_id as reviewee_id
        FROM announcement_completion_status acs
        JOIN announcement_completion_status other_acs ON acs.announcement_id = other_acs.announcement_id
        WHERE acs.announcement_id = announcement_uuid
        AND acs.user_id != other_acs.user_id
    ),
    existing_reviews AS (
        -- Get all existing reviews
        SELECT 
            reviewer_id,
            reviewee_id
        FROM reviews
        WHERE ride_id = announcement_uuid
    )
    SELECT 
        COUNT(*) as total_possible_reviews,
        COUNT(DISTINCT CONCAT(reviewer_id::TEXT, '-', reviewee_id::TEXT)) as existing_review_count
    INTO participant_count, reviewed_count
    FROM all_possible_reviews ap
    LEFT JOIN existing_reviews er ON ap.reviewer_id = er.reviewer_id AND ap.reviewee_id = er.reviewee_id;
    
    -- All participants reviewed when every possible review combination exists
    all_participants_reviewed := (reviewed_count >= participant_count);
    
    -- Only mark announcement as completed when BOTH conditions are met:
    -- 1. All participants have completed the ride
    -- 2. All participants have provided feedback for each other
    IF all_participants_completed AND all_participants_reviewed THEN
        UPDATE announcements 
        SET 
            ride_completed = true,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = announcement_uuid;
        
        -- Create completion notifications for all participants
        INSERT INTO notifications (
            recipient_id,
            sender_id,
            type,
            title,
            message,
            announcement_id,
            is_read,
            created_at
        )
        SELECT 
            acs.user_id,
            a.created_by,
            'ride_fully_completed',
            'Ride Fully Completed',
            'All participants have completed the ride and provided feedback. Thank you for using LinkCab!',
            announcement_uuid,
            false,
            CURRENT_TIMESTAMP
        FROM announcement_completion_status acs
        JOIN announcements a ON a.id = acs.announcement_id
        WHERE acs.announcement_id = announcement_uuid;
    END IF;
    
    -- Return completion status
    result := json_build_object(
        'success', true,
        'completion_status', CASE 
            WHEN all_participants_completed AND all_participants_reviewed THEN 'completed' 
            WHEN all_participants_completed THEN 'pending_reviews' 
            ELSE 'pending_completion' 
        END,
        'participant_count', participant_count,
        'completed_count', completed_count,
        'reviewed_count', reviewed_count,
        'all_completed', all_participants_completed AND all_participants_reviewed,
        'all_participants_completed', all_participants_completed,
        'all_participants_reviewed', all_participants_reviewed
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can complete ride and show completion/review status
CREATE OR REPLACE FUNCTION can_complete_ride(announcement_uuid UUID, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    announcement_record RECORD;
    participant_record RECORD;
    completion_record RECORD;
    is_creator BOOLEAN;
    is_participant BOOLEAN;
    can_complete BOOLEAN;
    completion_type VARCHAR;
    all_participants_completed BOOLEAN;
    all_participants_reviewed BOOLEAN;
    completed_count INTEGER;
    total_participants INTEGER;
    reviewed_count INTEGER;
    total_possible_reviews INTEGER;
BEGIN
    -- Get announcement details
    SELECT * INTO announcement_record
    FROM announcements
    WHERE id = announcement_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'can_complete', false,
            'reason', 'Announcement not found'
        );
    END IF;
    
    -- Check if user is creator
    is_creator := (announcement_record.created_by = user_uuid);
    
    -- Check if user is accepted participant
    SELECT * INTO participant_record
    FROM announcement_participants
    WHERE announcement_id = announcement_uuid
    AND user_id = user_uuid
    AND status = 'accepted';
    
    is_participant := FOUND;
    
    -- Check if already completed
    SELECT * INTO completion_record
    FROM announcement_completion_status
    WHERE announcement_id = announcement_uuid
    AND user_id = user_uuid;
    
    -- Determine if user can complete
    IF is_creator THEN
        can_complete := true;
        completion_type := 'creator';
    ELSIF is_participant THEN
        can_complete := true;
        completion_type := 'participant';
    ELSE
        can_complete := false;
        completion_type := NULL;
    END IF;
    
    -- Check if already completed
    IF completion_record.completed THEN
        can_complete := false;
    END IF;
    
    -- Get completion and review statistics
    SELECT 
        COUNT(*) as total_participants,
        COUNT(*) FILTER (WHERE completed = true) as completed_participants
    INTO total_participants, completed_count
    FROM announcement_completion_status 
    WHERE announcement_id = announcement_uuid;
    
    all_participants_completed := (total_participants = completed_count);
    
    -- Check review status
    WITH all_possible_reviews AS (
        SELECT 
            acs.user_id as reviewer_id,
            other_acs.user_id as reviewee_id
        FROM announcement_completion_status acs
        JOIN announcement_completion_status other_acs ON acs.announcement_id = other_acs.announcement_id
        WHERE acs.announcement_id = announcement_uuid
        AND acs.user_id != other_acs.user_id
    ),
    existing_reviews AS (
        SELECT 
            reviewer_id,
            reviewee_id
        FROM reviews
        WHERE ride_id = announcement_uuid
    )
    SELECT 
        COUNT(*) as total_possible,
        COUNT(DISTINCT CONCAT(reviewer_id::TEXT, '-', reviewee_id::TEXT)) as existing_count
    INTO total_possible_reviews, reviewed_count
    FROM all_possible_reviews ap
    LEFT JOIN existing_reviews er ON ap.reviewer_id = er.reviewer_id AND ap.reviewee_id = er.reviewee_id;
    
    all_participants_reviewed := (reviewed_count >= total_possible_reviews);
    
    RETURN json_build_object(
        'can_complete', can_complete,
        'completion_type', completion_type,
        'is_creator', is_creator,
        'is_participant', is_participant,
        'already_completed', COALESCE(completion_record.completed, false),
        'all_participants_completed', all_participants_completed,
        'all_participants_reviewed', all_participants_reviewed,
        'total_participants', total_participants,
        'completed_count', completed_count,
        'total_possible_reviews', total_possible_reviews,
        'reviewed_count', reviewed_count,
        'is_time_passed', (announcement_record.date || ' ' || announcement_record.time)::TIMESTAMP <= CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_ride_completion_status TO authenticated;
GRANT EXECUTE ON FUNCTION can_complete_ride TO authenticated;
