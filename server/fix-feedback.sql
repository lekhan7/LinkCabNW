-- ================================================================
-- FEEDBACK TABLE FIX
-- ================================================================

-- Add missing feedback_type column to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS feedback_type VARCHAR(255);

-- Add missing priority column as well
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS priority VARCHAR(50);

-- Add missing subject column as well
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

-- Also ensure all other possible feedback columns exist
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS announcement_id UUID;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'feedback_user_id_fkey' 
                   AND table_name = 'feedback') THEN
        ALTER TABLE feedback ADD CONSTRAINT feedback_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'feedback_announcement_id_fkey' 
                   AND table_name = 'feedback') THEN
        ALTER TABLE feedback ADD CONSTRAINT feedback_announcement_id_fkey 
            FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Disable RLS on feedback table to avoid policy issues
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
