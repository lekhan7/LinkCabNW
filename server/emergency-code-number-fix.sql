-- EMERGENCY FIX: Add default value to code_number column
-- This will fix the null constraint issue immediately without server restart

-- Add a default value to the code_number column
ALTER TABLE users ALTER COLUMN code_number SET DEFAULT 'LC000000000';

-- Also make sure the column is NOT NULL (it should be already)
ALTER TABLE users ALTER COLUMN code_number SET NOT NULL;

-- Test the default value works
DO $$
BEGIN
    -- Test insertion without providing code_number (should use default)
    INSERT INTO users (name, phone_number, password, email) 
    VALUES ('Emergency Test', '5555555555', 'hash', 'emergency@test.com');
    
    RAISE NOTICE '✅ Emergency test PASSED - Default code_number working';
    
    -- Clean up
    DELETE FROM users WHERE phone_number = '5555555555';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Emergency test FAILED: %', SQLERRM;
END $$;

-- Verify the column properties
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'code_number';

SELECT '✅ Emergency database fix applied - code_number now has default value' as status;
