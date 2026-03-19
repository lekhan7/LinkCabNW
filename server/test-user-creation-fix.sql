-- Test script to verify user creation works after RLS fix
-- Run this after applying the new-rls-user-fix.sql

-- Test 1: Try to insert a new user (this should work now)
DO $$
BEGIN
    -- This simulates what happens during user registration
    INSERT INTO users (
        name, 
        code_number, 
        phone_number, 
        password
    ) VALUES (
        'Test User',
        'TEST001',
        '9876543210',
        'hashed_password_placeholder'
    );
    
    RAISE NOTICE '✅ User creation test PASSED - No RLS error occurred';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ User creation test FAILED - Error: %', SQLERRM;
END $$;

-- Test 2: Verify the user was actually created
SELECT 
    id,
    name,
    code_number,
    phone_number,
    created_at
FROM users 
WHERE phone_number = '9876543210';

-- Test 3: Check current RLS policies on users table
SELECT 
    'Current RLS Policies on users table:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Test 4: Clean up the test user
DELETE FROM users WHERE phone_number = '9876543210';

SELECT '✅ Test completed - Check the notices above for results' as final_status;
