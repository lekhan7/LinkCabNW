-- ================================================================
-- REVIEW DETAILS TABLE SCHEMA FIX
-- ================================================================

-- Add missing report_description column to review_details table
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS report_description TEXT;

-- Add missing report_type column as well
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS report_type VARCHAR(255);

-- Add missing review_description column (different from feedback)
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS review_description TEXT;

-- Add missing reviewee_id column (alias for reviewed_user_id)
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS reviewee_id UUID;

-- Add missing stars column (alias for rating)
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS stars INTEGER;

-- Also check if review_details table has all required columns for reviews
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS announcement_id UUID;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS reviewer_id UUID;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS reviewed_user_id UUID;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'review_details_announcement_id_fkey' 
                   AND table_name = 'review_details') THEN
        ALTER TABLE review_details ADD CONSTRAINT review_details_announcement_id_fkey 
            FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'review_details_reviewer_id_fkey' 
                   AND table_name = 'review_details') THEN
        ALTER TABLE review_details ADD CONSTRAINT review_details_reviewer_id_fkey 
            FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'review_details_reviewed_user_id_fkey' 
                   AND table_name = 'review_details') THEN
        ALTER TABLE review_details ADD CONSTRAINT review_details_reviewed_user_id_fkey 
            FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;
