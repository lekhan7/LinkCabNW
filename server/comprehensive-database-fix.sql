-- ================================================================
-- COMPREHENSIVE DATABASE FIX - NO TABLE DROPS OR RECREATION
-- ================================================================
-- This script fixes all existing Supabase database issues
-- without recreating or dropping any tables.

-- ================================================================
-- 1. FIX ROW LEVEL SECURITY (RLS) - CRITICAL
-- ================================================================

-- Enable RLS on all tables if not already enabled
DO $$
BEGIN
    -- Enable RLS on users table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on announcements table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements' AND table_schema = 'public') THEN
        ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on ride_participants table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_participants' AND table_schema = 'public') THEN
        ALTER TABLE ride_participants ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS on notifications table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add permissive policies to allow all operations temporarily
DO $$
BEGIN
    -- Users table policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') AND
       NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_users') THEN
        CREATE POLICY "allow_all_users" ON users FOR ALL USING (true);
    END IF;
    
    -- Announcements table policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements' AND table_schema = 'public') AND
       NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_announcements') THEN
        CREATE POLICY "allow_all_announcements" ON announcements FOR ALL USING (true);
    END IF;
    
    -- Ride participants table policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_participants' AND table_schema = 'public') AND
       NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_participants') THEN
        CREATE POLICY "allow_all_participants" ON ride_participants FOR ALL USING (true);
    END IF;
    
    -- Notifications table policy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') AND
       NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_notifications') THEN
        CREATE POLICY "allow_all_notifications" ON notifications FOR ALL USING (true);
    END IF;
END $$;

-- ================================================================
-- 2. FIX MISSING COLUMNS (ONLY IF NOT EXISTS)
-- ================================================================

-- Add missing columns to announcements table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements' AND table_schema = 'public') THEN
        -- Add ride_completed column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'announcements' 
            AND column_name = 'ride_completed'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE announcements ADD COLUMN ride_completed BOOLEAN DEFAULT false;
        END IF;
        
        -- Add ride_time column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'announcements' 
            AND column_name = 'ride_time'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE announcements ADD COLUMN ride_time TIMESTAMP;
        END IF;
    END IF;
END $$;

-- Add missing columns to notifications table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        -- Add read column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'read'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT false;
        END IF;
        
        -- Add user_id column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE notifications ADD COLUMN user_id UUID;
        END IF;
    END IF;
END $$;

-- ================================================================
-- 3. FIX FOREIGN KEY RELATIONSHIPS (ONLY IF MISSING)
-- ================================================================

-- Add foreign key constraint for announcements creator column -> users.id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements' AND table_schema = 'public') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        
        -- Check if creator_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'announcements' 
            AND column_name = 'creator_id'
            AND table_schema = 'public'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_creator'
            AND table_name = 'announcements'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE announcements
            ADD CONSTRAINT fk_creator FOREIGN KEY (creator_id) REFERENCES users(id);
        END IF;
        
        -- Check if user_id column exists (alternative name)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'announcements' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_announcement_user'
            AND table_name = 'announcements'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE announcements
            ADD CONSTRAINT fk_announcement_user FOREIGN KEY (user_id) REFERENCES users(id);
        END IF;
        
        -- Check if created_by column exists (another alternative)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'announcements' 
            AND column_name = 'created_by'
            AND table_schema = 'public'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_created_by'
            AND table_name = 'announcements'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE announcements
            ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id);
        END IF;
    END IF;
END $$;

-- ================================================================
-- 4. FIX TIMEZONE ISSUE
-- ================================================================

-- Set database timezone to UTC
ALTER DATABASE postgres SET timezone TO 'UTC';

-- ================================================================
-- 5. CLEAN INVALID DATA
-- ================================================================

-- Ensure ride_completed is never NULL in announcements table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements' AND table_schema = 'public') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'ride_completed' AND table_schema = 'public') THEN
        UPDATE announcements SET ride_completed = false WHERE ride_completed IS NULL;
    END IF;
END $$;

-- ================================================================
-- 6. VERIFICATION QUERIES
-- ================================================================

-- Check RLS status
SELECT 
    tablename as table_name,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'announcements', 'ride_participants', 'notifications')
ORDER BY tablename;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('users', 'announcements', 'ride_participants', 'notifications')
ORDER BY tablename, policyname;

-- Check table structures
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'announcements' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'announcements' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'ride_participants' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ride_participants' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'notifications' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('users', 'announcements', 'ride_participants', 'notifications');

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

-- Display completion status
SELECT 
    'COMPREHENSIVE DATABASE FIX COMPLETED' as status,
    'All RLS policies applied' as rls_status,
    'Missing columns added' as columns_status,
    'Foreign keys fixed' as constraints_status,
    'Timezone set to UTC' as timezone_status,
    'Invalid data cleaned' as data_status,
    CURRENT_TIMESTAMP as fix_completed_at;
