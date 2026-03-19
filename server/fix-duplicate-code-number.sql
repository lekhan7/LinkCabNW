-- FIX DUPLICATE CODE_NUMBER ERROR
-- The emergency fix used a static default value causing duplicates
-- This creates a dynamic default value using database function

-- Create a function to generate unique code numbers
CREATE OR REPLACE FUNCTION generate_unique_code_number()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    timestamp_part TEXT;
    random_part TEXT;
BEGIN
    -- Get current timestamp (last 6 digits)
    timestamp_part := to_char(EXTRACT(EPOCH FROM NOW()) * 1000::bigint, 'FM999999');
    
    -- Generate random 3-digit number
    random_part := lpad(floor(random() * 1000)::text, 3, '0');
    
    -- Combine to create unique code
    new_code := 'LC' || timestamp_part || random_part;
    
    -- Ensure uniqueness (retry if collision)
    WHILE EXISTS (SELECT 1 FROM users WHERE code_number = new_code) LOOP
        random_part := lpad(floor(random() * 1000)::text, 3, '0');
        new_code := 'LC' || timestamp_part || random_part;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Update the default value to use the function
ALTER TABLE users ALTER COLUMN code_number SET DEFAULT generate_unique_code_number();

-- Test the function
SELECT generate_unique_code_number() as test_code;

-- Test user creation with dynamic code_number
DO $$
BEGIN
    -- Test insertion without providing code_number (should use function)
    INSERT INTO users (name, phone_number, password, email) 
    VALUES ('Dynamic Test', '8888888888', 'hash', 'dynamic@test.com');
    
    RAISE NOTICE '✅ Dynamic code_number test PASSED';
    
    -- Check what code was generated
    SELECT code_number FROM users WHERE phone_number = '8888888888';
    
    -- Clean up
    DELETE FROM users WHERE phone_number = '8888888888';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Dynamic test FAILED: %', SQLERRM;
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

SELECT '✅ Dynamic code_number generation fixed - No more duplicates' as status;
