-- Check notification creation issues
-- This will help us understand why real notifications aren't being created

-- Check if the notification creation function exists
SELECT 'Checking if create_join_request_notification function exists:' as info;
SELECT proname, prosrc FROM pg_proc WHERE proname = 'create_join_request_notification';

-- Check if the create_favorite_match_notification function exists  
SELECT 'Checking if create_favorite_match_notification function exists:' as info;
SELECT proname, prosrc FROM pg_proc WHERE proname = 'create_favorite_match_notification';

-- Check current notification RLS policies that might be blocking insertion
SELECT 
    'Current notification RLS policies:' as info,
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

-- Test manual notification insertion (simulate what the code does)
DO $$
DECLARE
    test_user_id UUID;
    test_announcement_id UUID;
    notification_result JSON;
BEGIN
    -- Get a test user and announcement
    SELECT id INTO test_user_id FROM users LIMIT 1;
    SELECT id INTO test_announcement_id FROM announcements LIMIT 1;
    
    IF test_user_id IS NULL OR test_announcement_id IS NULL THEN
        RAISE NOTICE '❌ No test users or announcements found';
        RETURN;
    END IF;
    
    -- Test direct notification insertion
    INSERT INTO notifications (
        recipient_id,
        sender_id,
        type,
        title,
        message,
        announcement_id,
        status,
        created_at
    ) VALUES (
        test_user_id,
        test_user_id,
        'join_request',
        'Test Join Request',
        'This is a test notification from the diagnostic script',
        test_announcement_id,
        'pending',
        CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE '✅ Manual notification insertion test PASSED';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Manual notification insertion FAILED: %', SQLERRM;
END $$;

-- Check if any notifications were created recently
SELECT 
    'Recent notifications (last 5):' as info,
    id,
    recipient_id,
    type,
    title,
    message,
    created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '✅ Notification creation diagnostic complete' as final_status;
