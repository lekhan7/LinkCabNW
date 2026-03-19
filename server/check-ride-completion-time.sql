-- Check ride completion time validation issue
-- This will help us understand why the backend says "Cannot complete ride before the scheduled time"

-- Check the specific announcement that's failing
SELECT 
    'Checking announcement 0246f799-72b3-4406-bd8a-9f77fd4d9837:' as info,
    id,
    created_by,
    "date",
    "time",
    ride_completed,
    created_at
FROM announcements 
WHERE id = '0246f799-72b3-4406-bd8a-9f77fd4d9837';

-- Check current server time
SELECT 
    'Current server time:' as info,
    NOW() as server_time,
    CURRENT_TIMESTAMP as current_timestamp;

-- Check the ride datetime calculation (same as backend)
SELECT 
    'Ride time validation check:' as info,
    "date",
    "time",
    CONCAT("date", 'T', "time") as combined_datetime,
    TO_TIMESTAMP(CONCAT("date", 'T', "time"), 'YYYY-MM-DDTHH24:MI:SS') as ride_datetime,
    NOW() as current_time,
    (TO_TIMESTAMP(CONCAT("date", 'T', "time"), 'YYYY-MM-DDTHH24:MI:SS') <= NOW()) as is_time_passed;

-- Check all announcements that might have time issues
SELECT 
    'All announcements with time validation:' as info,
    id,
    "date",
    "time",
    CONCAT("date", 'T', "time") as combined_datetime,
    ride_completed,
    CASE 
        WHEN TO_TIMESTAMP(CONCAT("date", 'T', "time"), 'YYYY-MM-DDTHH24:MI:SS') <= NOW() 
        THEN 'SHOULD BE ALLOWED'
        ELSE 'SHOULD BE BLOCKED'
    END as time_validation_result
FROM announcements 
ORDER BY "date" DESC, "time" DESC
LIMIT 10;

SELECT '✅ Ride completion time validation diagnostic complete' as final_status;
