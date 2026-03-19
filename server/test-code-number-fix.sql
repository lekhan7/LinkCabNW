-- Test the code_number generation fix
-- This will help verify if the issue is on the backend or database side

-- First, let's check what the current users table looks like
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'code_number';

-- Test manual insertion with code_number to see if RLS policies are the issue
DO $$
BEGIN
    -- Try to insert a user manually with code_number
    INSERT INTO users (
        name, 
        code_number, 
        phone_number, 
        password,
        email
    ) VALUES (
        'Test User Manual',
        'LC123456789',
        '9998887777',
        'hashed_password',
        'test@example.com'
    );
    
    RAISE NOTICE '✅ Manual user insertion with code_number SUCCESS';
    
    -- Clean up
    DELETE FROM users WHERE phone_number = '9998887777';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Manual user insertion FAILED: %', SQLERRM;
END $$;

-- Check current RLS policies that might be blocking insertion
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual, 1, 100)
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || substring(with_check, 1, 100)
        ELSE 'No condition'
    END as condition
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'INSERT'
ORDER BY policyname;
