-- Updated completion logic: Announcements can only be marked as completed 
-- after ALL co-passengers have submitted reviews
-- If there are no co-passengers, creator can complete directly

-- Drop existing functions and recreate with new logic
DROP FUNCTION IF EXISTS update_ride_completion_status CASCADE;
DROP FUNCTION IF EXISTS can_complete_ride CASCADE;

-- New completion logic based on reviews, not just completion status
CREATE OR REPLACE FUNCTION update_ride_completion_status(
    announcement_uuid UUID,
    user_uuid UUID,
    completion_type VARCHAR
) 
RETURNS JSON AS $$
DECLARE
    announcement_record RECORD;
    participant_count INTEGER;
    accepted_participants INTEGER;
    reviews_count INTEGER;
    required_reviews INTEGER;
    all_reviews_submitted BOOLEAN;
    result JSON;
BEGIN
    -- Get announcement details
    SELECT * INTO announcement_record
    FROM announcements
    WHERE id = announcement_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Announcement not found'
        );
    END IF;
    
    -- Count accepted participants (excluding creator)
    SELECT COUNT(*) INTO accepted_participants
    FROM announcement_participants
    WHERE announcement_id = announcement_uuid
    AND status = 'accepted';
    
    -- Total participants = creator + accepted participants
    participant_count := accepted_participants + 1;
    
    -- Count reviews submitted for this announcement
    SELECT COUNT(*) INTO reviews_count
    FROM review_details
    WHERE announcement_id = announcement_uuid;
    
    -- Calculate required reviews
    -- If no co-passengers, no reviews required
    -- If co-passengers exist, each co-passenger should review the creator
    IF accepted_participants = 0 THEN
        required_reviews := 0;
        all_reviews_submitted := true;
    ELSE
        required_reviews := accepted_participants; -- Each co-passenger reviews creator
        all_reviews_submitted := (reviews_count >= required_reviews);
    END IF;
    
    -- Insert/update user completion status
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
    
    -- Only mark announcement as completed when all required reviews are submitted
    IF all_reviews_submitted THEN
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
            ap.user_id,
            announcement_record.created_by,
            'ride_fully_completed',
            'Ride Fully Completed',
            'All required reviews have been submitted. Ride is now marked as completed!',
            announcement_uuid,
            false,
            CURRENT_TIMESTAMP
        FROM announcement_participants ap
        WHERE ap.announcement_id = announcement_uuid
        AND ap.status = 'accepted'
        
        UNION ALL
        
        SELECT 
            announcement_record.created_by,
            announcement_record.created_by,
            'ride_fully_completed',
            'Ride Fully Completed',
            'All required reviews have been submitted. Ride is now marked as completed!',
            announcement_uuid,
            false,
            CURRENT_TIMESTAMP;
    END IF;
    
    -- Return completion status
    result := json_build_object(
        'success', true,
        'completion_status', CASE 
            WHEN all_reviews_submitted THEN 'completed' 
            ELSE 'pending_reviews' 
        END,
        'participant_count', participant_count,
        'accepted_participants', accepted_participants,
        'reviews_count', reviews_count,
        'required_reviews', required_reviews,
        'all_reviews_submitted', all_reviews_submitted,
        'announcement_completed', announcement_record.ride_completed
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Updated function to check if user can complete ride
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
    accepted_participants INTEGER;
    reviews_count INTEGER;
    required_reviews INTEGER;
    all_reviews_submitted BOOLEAN;
    already_completed BOOLEAN;
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
    
    -- Check if user has already completed this ride
    SELECT * INTO completion_record
    FROM announcement_completion_status
    WHERE announcement_id = announcement_uuid
    AND user_id = user_uuid;
    
    already_completed := COALESCE(completion_record.completed, false);
    
    -- Count accepted participants (excluding creator)
    SELECT COUNT(*) INTO accepted_participants
    FROM announcement_participants
    WHERE announcement_id = announcement_uuid
    AND status = 'accepted';
    
    -- Count reviews submitted
    SELECT COUNT(*) INTO reviews_count
    FROM review_details
    WHERE announcement_id = announcement_uuid;
    
    -- Calculate required reviews
    IF accepted_participants = 0 THEN
        required_reviews := 0;
        all_reviews_submitted := true;
    ELSE
        required_reviews := accepted_participants;
        all_reviews_submitted := (reviews_count >= required_reviews);
    END IF;
    
    -- Determine if user can complete
    -- Both creator and participants can complete (to submit their completion status)
    IF is_creator OR is_participant THEN
        can_complete := NOT already_completed;
        completion_type := CASE WHEN is_creator THEN 'creator' ELSE 'participant' END;
    ELSE
        can_complete := false;
        completion_type := NULL;
    END IF;
    
    -- Don't allow completion if announcement is already completed
    IF announcement_record.ride_completed THEN
        can_complete := false;
    END IF;
    
    RETURN json_build_object(
        'can_complete', can_complete,
        'completion_type', completion_type,
        'is_creator', is_creator,
        'is_participant', is_participant,
        'already_completed', already_completed,
        'announcement_completed', announcement_record.ride_completed,
        'accepted_participants', accepted_participants,
        'reviews_count', reviews_count,
        'required_reviews', required_reviews,
        'all_reviews_submitted', all_reviews_submitted,
        'is_time_passed', (announcement_record.date || ' ' || announcement_record.time)::TIMESTAMP <= CURRENT_TIMESTAMP,
        'message', CASE 
            WHEN announcement_record.ride_completed THEN 'Announcement already completed'
            WHEN already_completed THEN 'You have already completed this ride'
            WHEN can_complete THEN 'You can complete this ride'
            ELSE 'You cannot complete this ride'
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_ride_completion_status TO authenticated;
GRANT EXECUTE ON FUNCTION can_complete_ride TO authenticated;
