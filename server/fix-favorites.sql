-- ================================================================
-- FAVORITES TABLE SCHEMA FIX
-- ================================================================

-- Add missing columns to favorite_routes table
ALTER TABLE favorite_routes ADD COLUMN IF NOT EXISTS announcement_id UUID;
ALTER TABLE favorite_routes ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'favorite_routes_announcement_id_fkey' 
                   AND table_name = 'favorite_routes') THEN
        ALTER TABLE favorite_routes ADD CONSTRAINT favorite_routes_announcement_id_fkey 
            FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'favorite_routes_created_by_fkey' 
                   AND table_name = 'favorite_routes') THEN
        ALTER TABLE favorite_routes ADD CONSTRAINT favorite_routes_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;
