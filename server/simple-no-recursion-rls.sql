-- ============================================
-- SIMPLE RLS FIX - NO RECURSION
-- ============================================
-- This fixes the infinite recursion by avoiding self-referencing policies

-- Step 1: Disable RLS completely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_rec.policyname || '" ON users';
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies

-- Policy 1: Allow anyone to insert users (fixes user creation)
CREATE POLICY "allow_user_insert" ON users 
FOR INSERT WITH CHECK (true);

-- Policy 2: Allow users to view their own profile
CREATE POLICY "allow_user_select_own" ON users 
FOR SELECT USING (auth.uid()::text = id::text);

-- Policy 3: Allow users to update their own profile  
CREATE POLICY "allow_user_update_own" ON users 
FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy 4: Allow public read access (for matching, no recursion)
CREATE POLICY "allow_public_select" ON users 
FOR SELECT USING (true);

-- Policy 5: Simple admin policy - check role directly, no self-reference
CREATE POLICY "allow_admin_all" ON users 
FOR ALL USING (role = 'admin' AND auth.uid()::text = id::text);

-- Step 5: Verify policies
SELECT 
    'POLICIES CREATED (no recursion):' as status,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual, 1, 50)
        WHEN with_check IS NOT NULL THEN 'CHECK: ' || substring(with_check, 1, 50)
        ELSE 'No condition'
    END as condition
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 6: Test user creation (should work now)
DO $$
BEGIN
    -- Simulate user creation
    INSERT INTO users (name, code_number, phone_number, password) 
    VALUES ('Test User', 'TEST123', '9999999999', 'hash');
    
    RAISE NOTICE '✅ User creation test PASSED';
    
    -- Clean up test user
    DELETE FROM users WHERE phone_number = '9999999999';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ User creation test FAILED: %', SQLERRM;
END $$;

SELECT '✅ Simple RLS fix applied - No recursion, user creation enabled' as final_status;
