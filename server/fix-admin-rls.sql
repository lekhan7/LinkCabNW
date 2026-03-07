-- ================================================================
-- FIX ADMIN RLS - ALLOW ADMIN AUTHENTICATION CHECKS
-- ================================================================

-- Step 1: Drop existing users table policies
DROP POLICY IF EXISTS "Admin full access to users" ON users;
DROP POLICY IF EXISTS "Users view users" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;

-- Step 2: Create a special admin check function that bypasses RLS
CREATE OR REPLACE FUNCTION check_admin_role(user_id uuid) 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
$$;

-- Step 3: Create new users table policies that allow admin authentication
CREATE POLICY "Admin full access to users" ON users
    FOR ALL USING (
        check_admin_role(auth.uid())
    );

-- Users can see their own profile and other users' basic info
CREATE POLICY "Users view users" ON users
    FOR SELECT USING (
        TRUE -- Public profile viewing
    );

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON users
    FOR UPDATE USING (
        id = auth.uid()
    );

-- Step 4: Update the is_admin function to use the new check_admin_role function
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT check_admin_role(auth.uid());
$$;

-- ================================================================
-- GRANT PERMISSIONS FOR ADMIN CHECKS
-- ================================================================

-- Grant execute permission on the admin check function
GRANT EXECUTE ON FUNCTION check_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_role(uuid) TO service_role;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

-- Admin RLS has been fixed!
-- Admin authentication checks should now work properly.
