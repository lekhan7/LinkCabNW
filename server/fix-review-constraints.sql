-- ================================================================
-- FIX REVIEW DETAILS NOT NULL CONSTRAINTS
-- ================================================================

-- Drop and recreate review_details table without NOT NULL constraints
DROP TABLE IF EXISTS review_details CASCADE;

-- Create review_details table with all possible columns and NULL allowed
CREATE TABLE review_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID,  -- Allow NULL
    announcement_id UUID,
    announcementId UUID,  -- CamelCase version
    reviewer_id UUID,
    reviewerId UUID,  -- CamelCase version  
    reviewed_user_id UUID,
    reviewee_id UUID,
    revieweeId UUID,  -- CamelCase version
    user_id UUID,  -- Allow NULL
    rating INTEGER,
    stars INTEGER,  -- Allow NULL
    feedback TEXT,
    review_description TEXT,
    report_type VARCHAR(255),
    report_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE review_details ADD CONSTRAINT review_details_announcement_id_fkey 
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;

ALTER TABLE review_details ADD CONSTRAINT review_details_reviewer_id_fkey 
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE review_details ADD CONSTRAINT review_details_reviewed_user_id_fkey 
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Disable RLS completely
ALTER TABLE review_details DISABLE ROW LEVEL SECURITY;
