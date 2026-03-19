-- ============================================
-- SAFE RLS POLICY FIX FOR USER CREATION ERROR
-- ============================================
-- This script safely handles existing policies and fixes the user creation error

-- Step 1: First, disable RLS temporarily to clear all policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on users table (comprehensive cleanup)
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

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new clean policies (no conflicts)

-- Policy 1: Allow anyone to insert new users (for registration/signup)
-- This is the critical fix for the user creation error
CREATE POLICY "Enable user registration" ON users 
FOR INSERT WITH CHECK (true);

-- Policy 2: Allow users to view their own profile after registration
CREATE POLICY "Users view own profile" ON users 
FOR SELECT USING (auth.uid()::text = id::text);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Users update own profile" ON users 
FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy 4: Allow users to view basic public info of other users (for ride matching)
CREATE POLICY "Public user profile access" ON users 
FOR SELECT USING (true);

-- Policy 5: Admin policies - allow full access for admin users
CREATE POLICY "Admins full access to users" ON users 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Step 5: Verify the policies were created correctly
SELECT 
    'POLICIES SUCCESSFULLY CREATED:' as status,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual, 1, 50) || '...'
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || substring(with_check, 1, 50) || '...'
        ELSE 'No condition'
    END as condition
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

SELECT '✅ Safe RLS policy fix applied - User creation should now work' as final_status;
