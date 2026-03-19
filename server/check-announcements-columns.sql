-- Check actual column names in announcements table
-- This will show us what columns really exist

SELECT 
    'Actual columns in announcements table:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'announcements' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check sample data to see what's actually there
SELECT 
    'Sample announcement data:' as info,
    *
FROM announcements 
LIMIT 1;

-- Check if there are any announcements at all
SELECT 
    'Total announcements count:' as info,
    COUNT(*) as total_count
FROM announcements;
