-- Fix RLS for Admin Login Issue
-- This script re-enables RLS with proper policies for admin access

-- Re-enable RLS on users table if disabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public user reads" ON users;
DROP POLICY IF EXISTS "Allow own profile updates" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Allow admin user deletion" ON users;

-- Create proper policies for admin login
-- Allow authenticated users to read their own profile
CREATE POLICY "Allow own profile read" ON users FOR SELECT USING (auth.uid()::text = id::text);

-- Allow users to update their own profile
CREATE POLICY "Allow own profile updates" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow user registration (insert)
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);

-- Allow admins to read all users (for admin functionality)
CREATE POLICY "Allow admins to read all users" ON users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Test the policies by checking if they exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';
