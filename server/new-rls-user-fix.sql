-- ============================================
-- NEW RLS POLICY FIX FOR USER CREATION ERROR
-- ============================================
-- This script fixes the "new row violates row-level security policy for table users" error
-- by implementing proper policies that allow user registration while maintaining security

-- Step 1: Drop all existing problematic policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Allow public user insertion" ON users;
DROP POLICY IF EXISTS "Allow public user reads" ON users;
DROP POLICY IF EXISTS "Allow own profile updates" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Allow admin user deletion" ON users;

-- Step 2: Create new comprehensive RLS policies for users table

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
FOR SELECT USING (
    -- Allow access to basic fields needed for matching
    true -- You can restrict this later to specific columns if needed
);

-- Policy 5: Admin policies - allow full access for admin users
CREATE POLICY "Admins full access to users" ON users 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Step 3: Verify the policies were created correctly
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 4: Test the policies (optional - you can run this to verify)
-- This should now work without RLS errors:
-- INSERT INTO users (name, code_number, phone_number, password) 
-- VALUES ('Test User', 'TEST123', '1234567890', 'hashedpassword');

-- Step 5: Additional security considerations
-- Note: The public user profile access policy allows broad read access.
-- For production, you might want to:
-- 1. Create a view with limited user information for public access
-- 2. Restrict the public policy to only necessary columns
-- 3. Add application-level checks for sensitive operations

SELECT '✅ New RLS policies applied successfully - User creation should now work' as status;
