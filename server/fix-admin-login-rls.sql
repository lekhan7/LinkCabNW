-- Fix for admin login issue - create a bypass for role checking
-- This file fixes the circular dependency in RLS policies

-- First, let's create a function that doesn't depend on RLS-protected tables
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  -- Check if user exists in users table with admin role
  -- Using service role to bypass RLS
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Drop existing policies on users table that cause circular dependency
DROP POLICY IF EXISTS "Admin full access to users" ON users;
DROP POLICY IF EXISTS "Users view users" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;

-- Create new policies that don't create circular dependencies
-- Allow users to view their own profile
CREATE POLICY "Users view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Allow users to update their own profile
CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow admins to view all users (using the new function)
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin_user());

-- Allow admins to update all users
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (is_admin_user());

-- Allow admins to delete all users
CREATE POLICY "Admins can delete all users" ON users
  FOR DELETE USING (is_admin_user());

-- Allow user registration (insert)
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

SELECT 'Admin login RLS fix applied successfully' as status;
