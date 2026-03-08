-- Force enable RLS and create the policy
-- This will ensure RLS is working for admin login

-- Force enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policy that might conflict
DROP POLICY IF EXISTS "Allow users to read own role" ON users;

-- Create the policy that allows users to read their own data
CREATE POLICY "Allow users to read own role" ON users 
FOR SELECT 
USING (auth.uid()::text = id::text);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'users';

-- Check RLS status
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users';
