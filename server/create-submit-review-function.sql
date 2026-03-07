-- Create the submit_review function
-- This function submits a review and updates user ratings

CREATE OR REPLACE FUNCTION submit_review(
    ride_uuid UUID,
    reviewer_uuid UUID,
    reviewee_uuid UUID,
    rating INTEGER,
    feedback TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    new_average_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ride_exists BOOLEAN;
    participant_exists BOOLEAN;
    already_reviewed BOOLEAN;
    new_avg NUMERIC;
BEGIN
    -- Check if the ride exists and is completed
    SELECT EXISTS(
        SELECT 1 FROM announcements 
        WHERE id = ride_uuid AND ride_completed = true
    ) INTO ride_exists;
    
    IF NOT ride_exists THEN
        RETURN QUERY SELECT false, 'Ride not found or not completed'::TEXT, NULL::NUMERIC;
        RETURN;
    END IF;
    
    -- Check if reviewer is a participant and reviewee is involved in the ride
    SELECT EXISTS(
        SELECT 1 FROM announcement_participants ap
        JOIN announcements a ON ap.announcement_id = a.id
        WHERE ap.announcement_id = ride_uuid 
        AND ap.user_id = reviewer_uuid 
        AND ap.status = 'accepted'
        AND (
            -- Reviewer is creator and reviewee is participant
            (a.created_by = reviewer_uuid AND ap.user_id = reviewee_uuid) OR
            -- Reviewer is participant and reviewee is creator
            (a.created_by = reviewee_uuid AND ap.user_id = reviewer_uuid)
        )
    ) INTO participant_exists;
    
    IF NOT participant_exists THEN
        RETURN QUERY SELECT false, 'You are not authorized to review this user for this ride'::TEXT, NULL::NUMERIC;
        RETURN;
    END IF;
    
    -- Check if review already exists
    SELECT EXISTS(
        SELECT 1 FROM reviews 
        WHERE ride_id = ride_uuid 
        AND reviewer_id = reviewer_uuid 
        AND reviewee_id = reviewee_uuid
    ) INTO already_reviewed;
    
    IF already_reviewed THEN
        RETURN QUERY SELECT false, 'You have already reviewed this user for this ride'::TEXT, NULL::NUMERIC;
        RETURN;
    END IF;
    
    -- Insert the review
    INSERT INTO reviews (
        ride_id, 
        reviewer_id, 
        reviewee_id, 
        rating, 
        feedback, 
        created_at
    ) VALUES (
        ride_uuid, 
        reviewer_uuid, 
        reviewee_uuid, 
        rating, 
        feedback, 
        NOW()
    );
    
    -- Update the reviewee's average rating
    UPDATE users 
    SET average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews 
        WHERE reviewee_id = reviewee_uuid
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM reviews 
        WHERE reviewee_id = reviewee_uuid
    )
    WHERE id = reviewee_uuid;
    
    -- Get the new average rating
    SELECT average_rating INTO new_avg
    FROM users 
    WHERE id = reviewee_uuid;
    
    RETURN QUERY SELECT true, 'Review submitted successfully'::TEXT, new_avg;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION submit_review TO authenticated;
GRANT EXECUTE ON FUNCTION submit_review TO service_role;
