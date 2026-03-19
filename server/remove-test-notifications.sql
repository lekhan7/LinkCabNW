-- Remove all test notifications and check why real notifications aren't working
-- This will clean up test data and diagnose the real notification system

-- First, remove all test notifications
DELETE FROM notifications WHERE 
    type IN ('Test Message', 'announcement_joined', 'JOIN_REQUEST_ACCEPTED', 'new_message')
    OR title LIKE '%Test%'
    OR title LIKE '%Welcome%'
    OR message LIKE '%test%'
    OR message LIKE '%Test%';

-- Verify test notifications are removed
SELECT 'Test notifications removed. Remaining notifications:' as info;
SELECT COUNT(*) as remaining_count FROM notifications;

-- Check what types of notifications should exist vs what actually exist
SELECT 
    'Current notification types in database:' as info,
    type,
    COUNT(*) as count
FROM notifications 
GROUP BY type
ORDER BY count DESC;

-- Check if the required notification creation functions exist
SELECT 'Checking required notification functions:' as info;
SELECT 
    proname,
    prokind,
    prosrc
FROM pg_proc 
WHERE proname IN (
    'create_join_request_notification', 
    'create_favorite_match_notification',
    'create_ride_completion_notification',
    'create_co_passenger_notification'
);

-- Check recent notification activity (real notifications only)
SELECT 
    'Recent real notifications (last 10):' as info,
    id,
    recipient_id,
    sender_id,
    type,
    title,
    message,
    announcement_id,
    status,
    created_at
FROM notifications 
WHERE title NOT LIKE '%Test%' 
    AND message NOT LIKE '%test%'
    AND title NOT LIKE '%Welcome%'
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any join requests that should have created notifications
SELECT 
    'Recent join requests that should have created notifications:' as info,
    ap.id,
    ap.announcement_id,
    ap.user_id,
    ap.status,
    ap.joined_at
FROM announcement_participants ap
ORDER BY ap.joined_at DESC
LIMIT 5;

-- Check if there are any announcements that should have created notifications
SELECT 
    'Recent announcements that should have created notifications:' as info,
    a.id,
    a.created_by,
    a.start_location_name,
    a.destination_name,
    a.created_at
FROM announcements a
ORDER BY a.created_at DESC
LIMIT 5;

SELECT '✅ Test notifications removed. Real notification system diagnosed.' as final_status;
