-- ============================================
-- FAVORITE RIDE SMART MATCH NOTIFICATION SYSTEM
-- ============================================

-- Function to create favorite match notifications for new announcements
CREATE OR REPLACE FUNCTION create_favorite_match_notification(announcement_uuid UUID)
RETURNS void AS $$
DECLARE
    announcement_record RECORD;
    matching_users RECORD;
    notification_message TEXT;
    traveler_username TEXT;
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
    traveler_username := COALESCE(announcement_record.creator_name, 'A user');
    
    -- Find users who have favorited this exact route (both directions)
    FOR matching_users IN 
        SELECT DISTINCT fr.user_id, u.name as user_name
        FROM favorite_routes fr
        JOIN users u ON fr.user_id = u.id
        WHERE (
            -- Exact match: from_location = start AND to_location = destination
            (fr.from_location ILIKE announcement_record.start_location_name AND 
             fr.to_location ILIKE announcement_record.destination_name)
            OR
            -- Reverse match: from_location = destination AND to_location = start  
            (fr.from_location ILIKE announcement_record.destination_name AND 
             fr.to_location ILIKE announcement_record.start_location_name)
        )
        AND fr.user_id != announcement_record.created_by  -- Exclude the creator
        AND NOT EXISTS (
            -- Prevent duplicate notifications for same announcement + user
            SELECT 1 FROM notifications n 
            WHERE n.recipient_id = fr.user_id 
            AND n.announcement_id = announcement_uuid 
            AND n.type = 'favorite_match'
        )
    LOOP
        -- Create notification for each matching user
        notification_message := format('%s is traveling from %s to %s on %s at %s. Would you like to join?', 
            traveler_username, 
            announcement_record.start_location_name, 
            announcement_record.destination_name,
            to_char(announcement_record.date, 'Mon DD, YYYY'),
            announcement_record.time
        );
        
        INSERT INTO notifications (
            recipient_id,
            sender_id,
            type,
            title,
            message,
            announcement_id,
            is_read,
            created_at
        ) VALUES (
            matching_users.user_id,
            announcement_record.created_by,
            'favorite_match',
            'Route Match Found',
            notification_message,
            announcement_uuid,
            false,
            CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Created favorite match notification for user % (%)', 
            matching_users.user_id, matching_users.user_name;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- Function to create favorite match notifications for new rides
CREATE OR REPLACE FUNCTION create_favorite_match_notification_for_ride(ride_uuid UUID)
RETURNS void AS $$
DECLARE
    ride_record RECORD;
    matching_users RECORD;
    notification_message TEXT;
    traveler_username TEXT;
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
    traveler_username := COALESCE(ride_record.creator_name, 'A user');
    
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
            AND n.type = 'favorite_match'
        )
    LOOP
        -- Create notification for each matching user
        notification_message := format('%s is traveling from %s to %s on %s at %s. Would you like to join?', 
            traveler_username, 
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
            'favorite_match',
            'Route Match Found',
            notification_message,
            ride_uuid,
            false,
            CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Created favorite match notification for user % (%)', 
            matching_users.user_id, matching_users.user_name;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance on favorite_routes
CREATE INDEX IF NOT EXISTS idx_favorite_routes_from_location ON favorite_routes(from_location);
CREATE INDEX IF NOT EXISTS idx_favorite_routes_to_location ON favorite_routes(to_location);
CREATE INDEX IF NOT EXISTS idx_favorite_routes_user_from_to ON favorite_routes(user_id, from_location, to_location);

-- Add index for notifications to prevent duplicates
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_announcement_type ON notifications(recipient_id, announcement_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_related_announcement_type ON notifications(recipient_id, related_announcement_id, type);

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_favorite_match_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_favorite_match_notification_for_ride TO authenticated;

-- ============================================
-- RIDE COMPLETION + RATING + REPORT SYSTEM
-- ============================================

-- Reports table for user reporting system
CREATE TABLE IF NOT EXISTS ride_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('misbehavior', 'no_show', 'unsafe_driving', 'rude_behavior', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, reporter_id, reported_user_id),
    CHECK (reporter_id != reported_user_id)
);

-- Indexes for ride_reports
CREATE INDEX IF NOT EXISTS idx_ride_reports_ride_id ON ride_reports(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_reports_reporter_id ON ride_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_ride_reports_reported_user_id ON ride_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_ride_reports_status ON ride_reports(status);

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

-- Function to get reviewable users for an announcement
CREATE OR REPLACE FUNCTION get_reviewable_users(announcement_uuid UUID, current_user_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    name VARCHAR,
    profile_picture TEXT,
    average_rating DECIMAL,
    completion_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH all_participants AS (
        -- Get creator
        SELECT 
            a.created_by as user_id,
            'creator' as completion_type
        FROM announcements a
        WHERE a.id = announcement_uuid
        
        UNION ALL
        
        -- Get accepted participants
        SELECT 
            ap.user_id,
            'participant' as completion_type
        FROM announcement_participants ap
        WHERE ap.announcement_id = announcement_uuid
        AND ap.status = 'accepted'
    ),
    completed_participants AS (
        SELECT 
            ap.user_id,
            ap.completion_type
        FROM all_participants ap
        JOIN announcement_completion_status acs ON acs.user_id = ap.user_id
        WHERE acs.announcement_id = announcement_uuid
        AND acs.completed = true
    )
    SELECT 
        u.id,
        u.name,
        u.profile_picture,
        u.average_rating,
        cp.completion_type
    FROM completed_participants cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.user_id != current_user_uuid  -- Exclude self
    AND NOT EXISTS (
        -- Exclude users already reviewed by current user
        SELECT 1 FROM reviews r 
        WHERE r.ride_id = announcement_uuid 
        AND r.reviewer_id = current_user_uuid 
        AND r.reviewee_id = cp.user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to submit a review
CREATE OR REPLACE FUNCTION submit_review(
    ride_uuid UUID,
    reviewer_uuid UUID,
    reviewee_uuid UUID,
    rating INTEGER,
    feedback TEXT
)
RETURNS JSON AS $$
DECLARE
    existing_review RECORD;
    result JSON;
    new_average DECIMAL;
BEGIN
    -- Check if review already exists
    SELECT * INTO existing_review
    FROM reviews 
    WHERE ride_id = ride_uuid 
    AND reviewer_id = reviewer_uuid 
    AND reviewee_id = reviewee_uuid;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Review already exists for this user'
        );
    END IF;
    
    -- Validate rating
    IF rating < 1 OR rating > 5 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Rating must be between 1 and 5'
        );
    END IF;
    
    -- Insert review
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
        COALESCE(feedback, ''),
        CURRENT_TIMESTAMP
    );
    
    -- Update user's average rating
    SELECT AVG(rating) INTO new_average
    FROM reviews
    WHERE reviewee_id = reviewee_uuid;
    
    UPDATE users 
    SET average_rating = COALESCE(new_average, 0),
        completed_trips = completed_trips + 1
    WHERE id = reviewee_uuid;
    
    -- Create notification for reviewed user
    INSERT INTO notifications (
        recipient_id,
        sender_id,
        type,
        title,
        message,
        announcement_id,
        is_read,
        created_at
    ) VALUES (
        reviewee_uuid,
        reviewer_uuid,
        'NEW_REVIEW',
        'New Review Received',
        format('You received a %d star review for your recent ride.', rating),
        ride_uuid,
        false,
        CURRENT_TIMESTAMP
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Review submitted successfully',
        'new_average_rating', new_average
    );
END;
$$ LANGUAGE plpgsql;

-- Function to submit a report
CREATE OR REPLACE FUNCTION submit_report(
    ride_uuid UUID,
    reporter_uuid UUID,
    reported_user_uuid UUID,
    report_reason VARCHAR,
    report_description TEXT
)
RETURNS JSON AS $$
DECLARE
    existing_report RECORD;
    result JSON;
BEGIN
    -- Check if report already exists
    SELECT * INTO existing_report
    FROM ride_reports 
    WHERE ride_id = ride_uuid 
    AND reporter_id = reporter_uuid 
    AND reported_user_id = reported_user_uuid;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Report already exists for this user'
        );
    END IF;
    
    -- Validate reason
    IF report_reason NOT IN ('misbehavior', 'no_show', 'unsafe_driving', 'rude_behavior', 'other') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid report reason'
        );
    END IF;
    
    -- Insert report
    INSERT INTO ride_reports (
        ride_id,
        reporter_id,
        reported_user_id,
        reason,
        description,
        created_at
    ) VALUES (
        ride_uuid,
        reporter_uuid,
        reported_user_uuid,
        report_reason,
        report_description,
        CURRENT_TIMESTAMP
    );
    
    -- Create notification for admins
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
        u.id,
        reporter_uuid,
        'new_report',
        'New User Report',
        format('A new report has been filed against a user. Reason: %s', report_reason),
        ride_uuid,
        false,
        CURRENT_TIMESTAMP
    FROM users u
    WHERE u.role = 'admin';
    
    RETURN json_build_object(
        'success', true,
        'message', 'Report submitted successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user analytics for ratings
CREATE OR REPLACE FUNCTION get_user_rating_analytics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    analytics JSON;
BEGIN
    SELECT json_build_object(
        'total_rides_completed', COALESCE(completed_trips, 0),
        'average_rating', COALESCE(average_rating, 0),
        'total_reviews_received', COALESCE(review_count, 0),
        'total_reports_received', COALESCE(report_count, 0),
        'star_distribution', json_build_object(
            '5_star', COALESCE(star_counts.five_star, 0),
            '4_star', COALESCE(star_counts.four_star, 0),
            '3_star', COALESCE(star_counts.three_star, 0),
            '2_star', COALESCE(star_counts.two_star, 0),
            '1_star', COALESCE(star_counts.one_star, 0)
        )
    ) INTO analytics
    FROM users u
    LEFT JOIN (
        SELECT 
            reviewee_id,
            COUNT(*) as review_count
        FROM reviews
        GROUP BY reviewee_id
    ) review_counts ON u.id = review_counts.reviewee_id
    LEFT JOIN (
        SELECT 
            reported_user_id,
            COUNT(*) as report_count
        FROM ride_reports
        GROUP BY reported_user_id
    ) report_counts ON u.id = report_counts.reported_user_id
    LEFT JOIN (
        SELECT 
            reviewee_id,
            COUNT(*) FILTER (WHERE rating = 5) as five_star,
            COUNT(*) FILTER (WHERE rating = 4) as four_star,
            COUNT(*) FILTER (WHERE rating = 3) as three_star,
            COUNT(*) FILTER (WHERE rating = 2) as two_star,
            COUNT(*) FILTER (WHERE rating = 1) as one_star
        FROM reviews
        GROUP BY reviewee_id
    ) star_counts ON u.id = star_counts.reviewee_id
    WHERE u.id = user_uuid;
    
    RETURN COALESCE(analytics, json_build_object());
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
GRANT EXECUTE ON FUNCTION get_reviewable_users TO authenticated;
GRANT EXECUTE ON FUNCTION submit_review TO authenticated;
GRANT EXECUTE ON FUNCTION submit_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rating_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION can_complete_ride TO authenticated;
