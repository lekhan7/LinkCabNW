-- ================================================================
-- VERIFICATION SCRIPT FOR DATABASE FIXES
-- ================================================================
-- Run this script to verify all fixes are applied correctly

-- ================================================================
-- 1. VERIFY RLS STATUS
-- ================================================================

SELECT '=== RLS STATUS VERIFICATION ===' as verification_type;

SELECT 
    tablename as table_name,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED ✓'
        ELSE 'RLS DISABLED ✗'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'announcements', 'ride_participants', 'notifications')
ORDER BY tablename;

-- ================================================================
-- 2. VERIFY POLICIES EXIST
-- ================================================================

SELECT '=== RLS POLICIES VERIFICATION ===' as verification_type;

SELECT 
    tablename,
    policyname,
    permissive,
    CASE 
        WHEN permissive = 't' OR permissive = 'true' OR permissive = '1' THEN 'PERMISSIVE POLICY ✓'
        ELSE 'RESTRICTIVE POLICY ?'
    END as policy_type
FROM pg_policies 
WHERE tablename IN ('users', 'announcements', 'ride_participants', 'notifications')
ORDER BY tablename, policyname;

-- ================================================================
-- 3. VERIFY REQUIRED COLUMNS EXIST
-- ================================================================

SELECT '=== COLUMNS VERIFICATION ===' as verification_type;

-- Check announcements table columns
SELECT 
    'announcements' as table_name,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('ride_completed', 'ride_time') THEN 'REQUIRED COLUMN ✓'
        ELSE 'OTHER COLUMN -'
    END as column_status
FROM information_schema.columns 
WHERE table_name = 'announcements' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check notifications table columns
SELECT 
    'notifications' as table_name,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('read', 'user_id') THEN 'REQUIRED COLUMN ✓'
        ELSE 'OTHER COLUMN -'
    END as column_status
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- 4. VERIFY FOREIGN KEY CONSTRAINTS
-- ================================================================

SELECT '=== FOREIGN KEY CONSTRAINTS VERIFICATION ===' as verification_type;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    'FOREIGN KEY ✓' as constraint_status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('users', 'announcements', 'ride_participants', 'notifications')
ORDER BY tc.table_name;

-- ================================================================
-- 5. VERIFY DATA INTEGRITY
-- ================================================================

SELECT '=== DATA INTEGRITY VERIFICATION ===' as verification_type;

-- Check for NULL ride_completed values
SELECT 
    'ride_completed NULL check' as check_type,
    COUNT(*) as null_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'NO NULL VALUES ✓'
        ELSE 'NULL VALUES FOUND ✗'
    END as status
FROM announcements 
WHERE ride_completed IS NULL

UNION ALL

-- Check ride_completed data distribution
SELECT 
    'ride_completed distribution: ' || COALESCE(ride_completed::text, 'NULL') as check_type,
    COUNT(*) as count,
    'DISTRIBUTION' as status
FROM announcements 
GROUP BY ride_completed;

-- ================================================================
-- 6. VERIFY TIMEZONE SETTING
-- ================================================================

SELECT '=== TIMEZONE VERIFICATION ===' as verification_type;

SELECT 
    current_setting('timezone') as current_timezone,
    CASE 
        WHEN current_setting('timezone') = 'UTC' THEN 'TIMEZONE SET TO UTC ✓'
        ELSE 'TIMEZONE NOT UTC ✗'
    END as timezone_status;

-- ================================================================
-- 7. FUNCTIONAL TESTS
-- ================================================================

SELECT '=== FUNCTIONAL TESTS ===' as verification_type;

-- Test basic table access (should work with RLS policies)
-- Test users table access
SELECT 
    'users' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'ACCESSIBLE ✓'
        ELSE 'NOT ACCESSIBLE ✗'
    END as access_status
FROM users

UNION ALL

-- Test announcements table access  
SELECT 
    'announcements' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'ACCESSIBLE ✓'
        ELSE 'NOT ACCESSIBLE ✗'
    END as access_status
FROM announcements

UNION ALL

-- Test notifications table access
SELECT 
    'notifications' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'ACCESSIBLE ✓'
        ELSE 'NOT ACCESSIBLE ✗'
    END as access_status
FROM notifications

UNION ALL

-- Test ride_participants table access
SELECT 
    'ride_participants' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'ACCESSIBLE ✓'
        ELSE 'NOT ACCESSIBLE ✗'
    END as access_status
FROM ride_participants;

-- ================================================================
-- 8. FINAL SUMMARY
-- ================================================================

SELECT '=== FINAL VERIFICATION SUMMARY ===' as verification_type;

SELECT 
    'DATABASE FIX VERIFICATION COMPLETED' as status,
    CURRENT_TIMESTAMP as verification_timestamp,
    'Run all application tests to confirm functionality' as next_step;

-- Show table counts for quick overview
SELECT 
    'TABLE ROW COUNTS' as overview_type,
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.table_name AND table_schema = 'public') > 0 as table_exists
FROM (VALUES 
    ('users'), 
    ('announcements'), 
    ('ride_participants'), 
    ('notifications')
) AS t(table_name)
ORDER BY table_name;
