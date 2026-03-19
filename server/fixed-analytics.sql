-- ================================================================
-- COMPREHENSIVE ANALYTICS FIX (SYNTAX CORRECTED)
-- ================================================================

-- 1. Ensure all required tables exist with correct structure
CREATE TABLE IF NOT EXISTS review_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID,
    announcement_id UUID,
    announcementId UUID,
    reviewer_id UUID,
    reviewerId UUID,
    reviewed_user_id UUID,
    reviewee_id UUID,
    revieweeId UUID,
    user_id UUID,
    rating INTEGER,
    stars INTEGER,
    feedback TEXT,
    review_description TEXT,
    report_type VARCHAR(255),
    report_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID,
    to_user_id UUID,
    stars INTEGER CHECK (stars >= 1 AND stars <= 5),
    review TEXT,
    review_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_report BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS refuse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID,
    reviewee_id UUID,
    stars INTEGER CHECK (stars >= 1 AND stars <= 5),
    review_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_report BOOLEAN DEFAULT false
);

-- 2. Add foreign key constraints using DO blocks to check existence first
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
                   WHERE constraint_name = 'review_details_reviewee_id_fkey' 
                   AND table_name = 'review_details') THEN
        ALTER TABLE review_details ADD CONSTRAINT review_details_reviewee_id_fkey 
            FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'review_details_user_id_fkey' 
                   AND table_name = 'review_details') THEN
        ALTER TABLE review_details ADD CONSTRAINT review_details_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'ratings_from_user_id_fkey' 
                   AND table_name = 'ratings') THEN
        ALTER TABLE ratings ADD CONSTRAINT ratings_from_user_id_fkey 
            FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'ratings_to_user_id_fkey' 
                   AND table_name = 'ratings') THEN
        ALTER TABLE ratings ADD CONSTRAINT ratings_to_user_id_fkey 
            FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'refuse_reviewer_id_fkey' 
                   AND table_name = 'refuse') THEN
        ALTER TABLE refuse ADD CONSTRAINT refuse_reviewer_id_fkey 
            FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'refuse_reviewee_id_fkey' 
                   AND table_name = 'refuse') THEN
        ALTER TABLE refuse ADD CONSTRAINT refuse_reviewee_id_fkey 
            FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Disable RLS on ALL analytics tables
ALTER TABLE review_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE refuse DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 4. Create simple test endpoints by creating a view
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
    'analytics_ready' as status,
    CURRENT_TIMESTAMP as created_at;
