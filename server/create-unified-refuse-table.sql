-- ================================================================
-- LINKCAB REVIEW SYSTEM MIGRATION
-- Drop old tables and create new unified 'Refuse' table
-- ================================================================

-- STEP 1: Drop old tables (if they exist)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;  -- Also drop the separate ratings table

-- STEP 2: Create the new unified 'Refuse' table
CREATE TABLE refuse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES announcements(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    
    -- Review data
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    review_description TEXT NOT NULL,
    
    -- Report data (optional - can be null for pure reviews)
    is_report BOOLEAN DEFAULT FALSE,
    report_category VARCHAR(50),
    report_description TEXT,
    report_severity VARCHAR(20) DEFAULT 'medium' CHECK (report_severity IN ('low', 'medium', 'high', 'critical')),
    report_status VARCHAR(20) DEFAULT 'pending' CHECK (report_status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(announcement_id, reviewer_id, reviewee_id),
    CHECK (reviewer_id != reviewee_id),
    CHECK (is_report = FALSE OR (is_report = TRUE AND report_category IS NOT NULL))
);

-- STEP 3: Create indexes for performance
CREATE INDEX idx_refuse_announcement ON refuse(announcement_id);
CREATE INDEX idx_refuse_reviewer ON refuse(reviewer_id);
CREATE INDEX idx_refuse_reviewee ON refuse(reviewee_id);
CREATE INDEX idx_refuse_stars ON refuse(stars);
CREATE INDEX idx_refuse_is_report ON refuse(is_report);
CREATE INDEX idx_refuse_report_status ON refuse(report_status) WHERE is_report = TRUE;
CREATE INDEX idx_refuse_created_at ON refuse(created_at);

-- STEP 4: Enable Row Level Security
ALTER TABLE refuse ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS policies
-- Users can view reviews they made or reviews about them
CREATE POLICY "Users can view own reviews and reviews about them" ON refuse
    FOR SELECT USING (
        auth.uid() = reviewer_id OR 
        auth.uid() = reviewee_id
    );

-- Admins can view all entries
CREATE POLICY "Admins can view all refuse entries" ON refuse
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users can insert reviews (not reports)
CREATE POLICY "Users can insert reviews" ON refuse
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id AND 
        is_report = FALSE
    );

-- Admins can insert reports
CREATE POLICY "Admins can insert reports" ON refuse
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON refuse
    FOR UPDATE USING (
        auth.uid() = reviewer_id AND 
        is_report = FALSE
    );

-- Admins can update all entries
CREATE POLICY "Admins can update all refuse entries" ON refuse
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- STEP 6: Create trigger for updated_at
CREATE TRIGGER update_refuse_updated_at 
    BEFORE UPDATE ON refuse 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 7: Grant permissions
GRANT ALL ON refuse TO authenticated;
GRANT ALL ON refuse TO service_role;

-- STEP 8: Create function to submit reviews (simplified unified version)
CREATE OR REPLACE FUNCTION submit_refuse_review(
    announcement_uuid UUID,
    reviewer_uuid UUID,
    reviewee_uuid UUID,
    stars INTEGER,
    review_description TEXT
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
    reviewer_name VARCHAR(50);
BEGIN
    -- Check if the ride exists and is completed
    SELECT EXISTS(
        SELECT 1 FROM announcements 
        WHERE id = announcement_uuid AND ride_completed = true
    ) INTO ride_exists;
    
    IF NOT ride_exists THEN
        RETURN QUERY SELECT false, 'Ride not found or not completed'::TEXT, NULL::NUMERIC;
        RETURN;
    END IF;
    
    -- Check if reviewer is a participant and reviewee is involved in the ride
    SELECT EXISTS(
        SELECT 1 FROM announcement_participants ap
        JOIN announcements a ON ap.announcement_id = a.id
        WHERE ap.announcement_id = announcement_uuid 
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
        SELECT 1 FROM refuse 
        WHERE announcement_id = announcement_uuid 
        AND reviewer_id = reviewer_uuid 
        AND reviewee_id = reviewee_uuid
    ) INTO already_reviewed;
    
    IF already_reviewed THEN
        RETURN QUERY SELECT false, 'You have already reviewed this user for this ride'::TEXT, NULL::NUMERIC;
        RETURN;
    END IF;
    
    -- Get reviewer name for notification
    SELECT name INTO reviewer_name FROM users WHERE id = reviewer_uuid;
    
    -- Insert the review
    INSERT INTO refuse (
        announcement_id, 
        reviewer_id, 
        reviewee_id, 
        stars, 
        review_description,
        is_report,
        created_at
    ) VALUES (
        announcement_uuid, 
        reviewer_uuid, 
        reviewee_uuid, 
        stars, 
        review_description,
        FALSE,
        NOW()
    );
    
    -- Update the reviewee's average rating
    UPDATE users 
    SET average_rating = (
        SELECT COALESCE(AVG(stars), 0)
        FROM refuse 
        WHERE reviewee_id = reviewee_uuid AND is_report = FALSE
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM refuse 
        WHERE reviewee_id = reviewee_uuid AND is_report = FALSE
    )
    WHERE id = reviewee_uuid;
    
    -- Get the new average rating
    SELECT average_rating INTO new_avg
    FROM users 
    WHERE id = reviewee_uuid;
    
    -- Create notification for the reviewee
    INSERT INTO notifications (
        recipient_id,
        sender_id,
        type,
        title,
        message,
        related_announcement_id,
        created_at
    ) VALUES (
        reviewee_uuid,
        reviewer_uuid,
        'NEW_REVIEW',
        'New Review Received',
        'You have been reviewed by ' || reviewer_name || ' with ' || stars || ' stars',
        announcement_uuid,
        NOW()
    );
    
    RETURN QUERY SELECT true, 'Review submitted successfully'::TEXT, new_avg;
END;
$$;

-- STEP 9: Create function to get user's review analytics
CREATE OR REPLACE FUNCTION get_user_review_analytics(user_uuid UUID)
RETURNS TABLE (
    total_reviews_given INTEGER,
    total_reviews_received INTEGER,
    average_rating_given NUMERIC,
    average_rating_received NUMERIC,
    reviews_given JSONB,
    reviews_received JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(COUNT(*) FILTER (WHERE reviewer_id = user_uuid), 0) as total_reviews_given,
        COALESCE(COUNT(*) FILTER (WHERE reviewee_id = user_uuid), 0) as total_reviews_received,
        COALESCE(AVG(stars) FILTER (WHERE reviewer_id = user_uuid), 0) as average_rating_given,
        COALESCE(AVG(stars) FILTER (WHERE reviewee_id = user_uuid AND is_report = FALSE), 0) as average_rating_received,
        COALESCE(
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'id', r.id,
                    'announcement_id', r.announcement_id,
                    'reviewee_name', u.name,
                    'reviewee_phone', u.phone_number,
                    'stars', r.stars,
                    'review_description', r.review_description,
                    'created_at', r.created_at
                ) 
            ) FILTER (WHERE reviewer_id = user_uuid),
            '[]'::JSONB
        ) as reviews_given,
        COALESCE(
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'id', r.id,
                    'announcement_id', r.announcement_id,
                    'reviewer_name', u.name,
                    'reviewer_phone', u.phone_number,
                    'stars', r.stars,
                    'review_description', r.review_description,
                    'created_at', r.created_at
                ) 
            ) FILTER (WHERE reviewee_id = user_uuid AND r.is_report = FALSE),
            '[]'::JSONB
        ) as reviews_received
    FROM refuse r
    LEFT JOIN users u ON (
        CASE 
            WHEN r.reviewer_id = user_uuid THEN u.id = r.reviewee_id
            ELSE u.id = r.reviewer_id
        END
    )
    WHERE r.reviewer_id = user_uuid OR r.reviewee_id = user_uuid;
END;
$$;

-- STEP 10: Grant permissions for new functions
GRANT EXECUTE ON FUNCTION submit_refuse_review TO authenticated;
GRANT EXECUTE ON FUNCTION submit_refuse_review TO service_role;
GRANT EXECUTE ON FUNCTION get_user_review_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_review_analytics TO service_role;

-- STEP 11: Update notification types to include NEW_REVIEW if not exists
DO $$
BEGIN
    -- Check if NEW_REVIEW is already in the notification type constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'notifications_type_check'
    ) THEN
        -- Add the constraint if it doesn't exist
        ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
        CHECK (type IN ('chat_joined', 'new_message', 'announcement_joined', 'preferred_place_match', 'join_request', 'join_accepted', 'join_rejected', 'JOIN_REQUEST_ACCEPTED', 'FAVORITE_ROUTE_MATCH', 'FAVORITE_RIDE_REPOST', 'NEW_REVIEW'));
    END IF;
END $$;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'LINKCAB REVIEW SYSTEM MIGRATION COMPLETE!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Dropped tables: reports, reviews, ratings';
    RAISE NOTICE 'Created new table: refuse';
    RAISE NOTICE 'New functions: submit_refuse_review, get_user_review_analytics';
    RAISE NOTICE 'Notifications: NEW_REVIEW type added';
    RAISE NOTICE '===========================================';
END $$;
