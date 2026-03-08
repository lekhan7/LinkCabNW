-- Check current RLS status and create minimal policy for admin login
-- This will allow the admin login to check the user role

-- First, check if RLS is enabled on users table
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'users';

-- Create a simple policy that allows authenticated users to read their own role
-- This is the MINIMUM policy needed for admin login to work
CREATE POLICY "Allow users to read own role" ON users 
FOR SELECT 
USING (auth.uid()::text = id::text);

-- Test if the policy works by checking current policies again
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'users';
