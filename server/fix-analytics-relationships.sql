-- ================================================================
-- FIX ANALYTICS FOREIGN KEY RELATIONSHIPS
-- ================================================================

-- Add missing foreign key constraint for review_details.user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'review_details_user_id_fkey' 
                   AND table_name = 'review_details') THEN
        ALTER TABLE review_details ADD CONSTRAINT review_details_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Also add other missing foreign key constraints that might be needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'review_details_reviewer_id_fkey' 
                   AND table_name = 'review_details') THEN
        ALTER TABLE review_details ADD CONSTRAINT review_details_reviewer_id_fkey 
            FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'review_details_reviewee_id_fkey' 
                   AND table_name = 'review_details') THEN
        ALTER TABLE review_details ADD CONSTRAINT review_details_reviewee_id_fkey 
            FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'review_details_announcement_id_fkey' 
                   AND table_name = 'review_details') THEN
        ALTER TABLE review_details ADD CONSTRAINT review_details_announcement_id_fkey 
            FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure all required columns exist in review_details for analytics
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS reviewer_id UUID;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS reviewee_id UUID;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS announcement_id UUID;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS stars INTEGER;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS review_description TEXT;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS report_type VARCHAR(255);
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS report_description TEXT;
ALTER TABLE review_details ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Disable RLS completely on review_details to avoid any policy issues
ALTER TABLE review_details DISABLE ROW LEVEL SECURITY;
