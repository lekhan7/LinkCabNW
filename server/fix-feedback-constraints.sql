-- ================================================================
-- COMPLETE FEEDBACK TABLE RECREATE FIX
-- ================================================================

-- Drop and recreate feedback table without NOT NULL constraints
DROP TABLE IF EXISTS feedback CASCADE;

-- Create feedback table with all possible columns allowing NULL
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    announcement_id UUID,
    type VARCHAR(255),  -- Allow NULL
    feedback_type VARCHAR(255),
    subject VARCHAR(255),
    priority VARCHAR(50),
    rating INTEGER,
    comment TEXT,
    message TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE feedback ADD CONSTRAINT feedback_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE feedback ADD CONSTRAINT feedback_announcement_id_fkey 
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;

-- Disable RLS completely
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
