-- Remove the policies I just created
-- This will drop the admin access policies

DROP POLICY IF EXISTS "Allow own profile read" ON users;
DROP POLICY IF EXISTS "Allow own profile updates" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Allow admins to read all users" ON users;

-- Confirm policies are removed
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'users';
