-- ============================================
-- COMPLETE RLS RESET - FINAL SOLUTION
-- ============================================
-- This completely resets RLS policies for users table

-- Step 1: Check current policies first
SELECT 
    'BEFORE CLEANUP - Current policies:' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 2: Disable RLS completely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop all policies dynamically
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
            RAISE NOTICE 'Dropped policy: %', policy_rec.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy %: %', policy_rec.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 4: Additional hardcoded drops
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Allow public user insertion" ON users;
DROP POLICY IF EXISTS "Allow public user reads" ON users;
DROP POLICY IF EXISTS "Allow own profile updates" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Allow admin user deletion" ON users;
DROP POLICY IF EXISTS "Enable user registration" ON users;
DROP POLICY IF EXISTS "Users view own profile" ON users;
DROP POLICY IF EXISTS "Public user profile access" ON users;
DROP POLICY IF EXISTS "Admins full access to users" ON users;
DROP POLICY IF EXISTS "Admin full access to users" ON users;

-- Step 5: Verify cleanup
SELECT 
    'AFTER CLEANUP - Remaining policies:' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 6: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 7: Create new policies with unique names
CREATE POLICY "user_registration_policy" ON users 
FOR INSERT WITH CHECK (true);

CREATE POLICY "user_view_own_policy" ON users 
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "user_update_own_policy" ON users 
FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "public_user_access_policy" ON users 
FOR SELECT USING (true);

CREATE POLICY "admin_full_access_policy" ON users 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Step 8: Final verification
SELECT 
    'FINAL - New policies created:' as status,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

SELECT '✅ Complete RLS reset done - User creation fixed' as final_status;
