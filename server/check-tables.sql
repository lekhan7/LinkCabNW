-- ================================================================
-- CHECK WHAT TABLES ACTUALLY EXIST
-- ================================================================

-- List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if ride_reports table exists specifically
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'ride_reports'
) AS ride_reports_exists;

-- Check if reports table exists (alternative name)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'reports'
) AS reports_exists;
