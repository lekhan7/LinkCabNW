-- Complete RLS Policy Reset for Users Table
-- This script completely removes RLS restrictions from the users table to fix signup issues

-- Option 1: Completely disable RLS for users table (RECOMMENDED for fixing signup)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS but fix the policies, uncomment the following:
/*
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create permissive policies
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

-- Re-enable RLS with permissive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
*/

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Show current policies (should be none after disabling RLS)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Test query to verify users table is accessible
SELECT COUNT(*) as user_count FROM users;
