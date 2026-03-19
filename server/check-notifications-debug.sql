-- Check notifications in database
-- This will help us understand why notifications aren't showing

-- Check if there are any notifications at all
SELECT 'Total notifications in database:' as info, COUNT(*) as count FROM notifications;

-- Check if there are notifications for specific users (replace with actual user IDs)
SELECT 
    'Notifications by recipient:' as info,
    recipient_id,
    COUNT(*) as count,
    MAX(created_at) as latest_notification
FROM notifications 
GROUP BY recipient_id 
ORDER BY count DESC;

-- Check recent notifications
SELECT 
    'Recent notifications (last 10):' as info,
    id,
    recipient_id,
    type,
    title,
    message,
    is_read,
    created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if the get_user_notifications function works
SELECT 'Testing function with null user_id (should get all):' as info;
SELECT * FROM public.get_user_notifications(false, 10, 0, NULL) LIMIT 5;

-- Check if RLS policies are blocking access
SELECT 
    'Current notification policies:' as info,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual, 1, 50)
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || substring(with_check, 1, 50)
        ELSE 'No condition'
    END as condition
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;
