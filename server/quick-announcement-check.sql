-- Quick check of the specific announcement that's failing
-- This will show us the exact date/time data

SELECT 
    'Announcement 0246f799-72b3-4406-bd8a-9f77fd4d9837 details:' as info,
    id,
    created_by,
    ride_completed,
    created_at,
    updated_at
FROM announcements 
WHERE id = '0246f799-72b3-4406-bd8a-9f77fd4d9837';

-- Check all columns for this announcement to see what date/time fields exist
SELECT 
    'All data for failing announcement:' as info
FROM announcements 
WHERE id = '0246f799-72b3-4406-bd8a-9f77fd4d9837';

-- Check current server time
SELECT 
    'Current server time:' as info,
    NOW() as server_time,
    CURRENT_TIMESTAMP as current_timestamp;

-- Simple time check - if ride was created more than 1 hour ago, it should be completable
SELECT 
    'Simple time check:' as info,
    created_at,
    NOW() as now,
    (NOW() - created_at) as time_difference,
    (NOW() - created_at > INTERVAL '1 hour') as should_be_completable
FROM announcements 
WHERE id = '0246f799-72b3-4406-bd8a-9f77fd4d9837';
