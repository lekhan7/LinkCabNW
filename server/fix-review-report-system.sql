-- ============================================
-- COMPREHENSIVE FIX FOR REVIEW AND REPORT SYSTEM
-- This script fixes all issues with review/report submission
-- ============================================

-- First, create the missing reports table if it doesn't exist
-- Import the reports table creation script
-- (You'll need to run create-reports-table.sql separately or copy its contents here)

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reported_user_id UUID NOT NULL REFERENCES users(id),
    announcement_id UUID NOT NULL REFERENCES announcements(id),
    category VARCHAR(50) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reporter_id, reported_user_id, announcement_id)
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_announcement ON reports(announcement_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reports
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
CREATE POLICY "Admins can view all reports" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can insert reports" ON reports;
CREATE POLICY "Users can insert reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports" ON reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON reports TO authenticated;
GRANT ALL ON reports TO service_role;

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
    -- Add total_reviews column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='total_reviews'
    ) THEN
        ALTER TABLE users ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;
    
    -- Add ride_completed column to announcements if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='announcements' AND column_name='ride_completed'
    ) THEN
        ALTER TABLE announcements ADD COLUMN ride_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Fix existing data: calculate total_reviews for all users
UPDATE users 
SET total_reviews = (
    SELECT COUNT(*) 
    FROM reviews 
    WHERE reviewee_id = users.id
)
WHERE total_reviews = 0 AND EXISTS (
    SELECT 1 FROM reviews WHERE reviewee_id = users.id
);

-- Fix existing data: calculate average_rating for all users
UPDATE users 
SET average_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews 
    WHERE reviewee_id = users.id
)
WHERE average_rating = 0 AND EXISTS (
    SELECT 1 FROM reviews WHERE reviewee_id = users.id
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_rating ON reviews(reviewee_id, rating);
CREATE INDEX IF NOT EXISTS idx_reports_announcement_status ON reports(announcement_id, status);

-- Create trigger for updated_at on reports table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Now create/update the submit_review function
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

-- Create the submit_report function
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
        category, 
        description, 
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

-- Grant necessary permissions for functions
GRANT EXECUTE ON FUNCTION submit_review TO authenticated;
GRANT EXECUTE ON FUNCTION submit_review TO service_role;
GRANT EXECUTE ON FUNCTION submit_report TO authenticated;
GRANT EXECUTE ON FUNCTION submit_report TO service_role;

-- Verification queries
-- Uncomment these to verify the setup
/*
-- Verify tables exist
SELECT tablename FROM pg_tables WHERE tablename IN ('reviews', 'reports', 'announcement_participants');

-- Verify functions exist
SELECT proname FROM pg_proc WHERE proname IN ('submit_review', 'submit_report');

-- Verify columns exist
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_reviews';
SELECT column_name FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'ride_completed';

-- Check data integrity
SELECT COUNT(*) as review_count FROM reviews;
SELECT COUNT(*) as report_count FROM reports;
SELECT COUNT(*) as participant_count FROM announcement_participants WHERE status = 'accepted';
*/

-- Output completion message
DO $$
BEGIN
    RAISE NOTICE 'Review and Report System Fix Complete!';
    RAISE NOTICE 'Tables: reviews, reports, announcement_participants';
    RAISE NOTICE 'Functions: submit_review, submit_report';
    RAISE NOTICE 'Columns: users.total_reviews, announcements.ride_completed';
END $$;
