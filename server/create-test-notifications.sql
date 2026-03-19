-- Check if notifications exist and create test data if needed

-- First, let's see if any notifications exist
SELECT 'Checking if notifications exist:' as status;
SELECT COUNT(*) as total_notifications FROM notifications;

-- Check if there are any users to create notifications for
SELECT 'Checking users in database:' as status;
SELECT id, name, email FROM users LIMIT 5;

-- If no notifications exist, create some test notifications
DO $$
DECLARE
    user_count INTEGER;
    test_user_id UUID;
BEGIN
    -- Get count of users
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count = 0 THEN
        RAISE NOTICE '❌ No users found - cannot create test notifications';
        RETURN;
    END IF;
    
    -- Get first user ID for testing
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    -- Create test notifications
    INSERT INTO notifications (
        recipient_id,
        sender_id,
        type,
        title,
        message,
        is_read,
        created_at
    ) VALUES 
    (
        test_user_id,
        test_user_id,
        'new_message',
        'Test Message',
        'This is a test notification to verify the system works',
        false,
        CURRENT_TIMESTAMP
    ),
    (
        test_user_id,
        test_user_id,
        'announcement_joined',
        'Welcome!',
        'Welcome to LinkCab! This is your first notification.',
        false,
        CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ),
    (
        test_user_id,
        test_user_id,
        'JOIN_REQUEST_ACCEPTED',
        'Ride Request Accepted',
        'Your ride request has been accepted by the driver.',
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 hours'
    );
    
    RAISE NOTICE '✅ Created 3 test notifications for user: %', test_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create test notifications: %', SQLERRM;
END $$;

-- Now check if notifications were created
SELECT 'After creating test notifications:' as status;
SELECT COUNT(*) as total_notifications FROM notifications;

-- Show the created notifications
SELECT 
    'Test notifications created:' as info,
    id,
    recipient_id,
    type,
    title,
    message,
    is_read,
    created_at
FROM notifications 
ORDER BY created_at DESC;

-- Test if the user can access their notifications (replace with actual user ID)
SELECT 'Testing notification access:' as info;
SELECT * FROM public.get_user_notifications(false, 10, 0, NULL) LIMIT 3;

SELECT '✅ Notification diagnostic complete - Check results above' as final_status;
