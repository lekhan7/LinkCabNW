-- Migration script to add reviewee_id and announcement_id to existing review_details table
-- Run this if the table already exists

-- Add reviewee_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='review_details' AND column_name='reviewee_id'
    ) THEN
        ALTER TABLE review_details ADD COLUMN reviewee_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Add announcement_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='review_details' AND column_name='announcement_id'
    ) THEN
        ALTER TABLE review_details ADD COLUMN announcement_id UUID REFERENCES announcements(id);
    END IF;
END $$;

-- Add index for reviewee_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_review_details_reviewee_id ON review_details(reviewee_id);

-- Update RLS policies to handle the new structure
DROP POLICY IF EXISTS "Allow all inserts" ON review_details;
DROP POLICY IF EXISTS "Allow all selects" ON review_details;
DROP POLICY IF EXISTS "Users can view own reviews" ON review_details;
DROP POLICY IF EXISTS "Users can insert own reviews" ON review_details;
DROP POLICY IF EXISTS "Admins can view all reviews" ON review_details;

-- New RLS Policies for review_details
CREATE POLICY "Allow all inserts" ON review_details FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all selects" ON review_details FOR SELECT USING (true);
CREATE POLICY "Users can view reviews about them" ON review_details FOR SELECT USING (auth.uid()::text = reviewee_id::text);
CREATE POLICY "Users can view reviews they wrote" ON review_details FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Admins can view all reviews" ON review_details FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = TRUE)
);
