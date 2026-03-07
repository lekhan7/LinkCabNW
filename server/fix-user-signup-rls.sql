-- Fix RLS policies for user signup
-- This script fixes the Row Level Security policies that are preventing user signup

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create new, more permissive policies that allow signup

-- Allow anyone to insert users (for signup)
CREATE POLICY "Allow public user insertion" ON users 
FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile (after they exist)
CREATE POLICY "Users can view own profile" ON users 
FOR SELECT USING (auth.uid()::text = id::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON users 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow admins to update all users
CREATE POLICY "Admins can update all users" ON users 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow admins to delete users
CREATE POLICY "Admins can delete users" ON users 
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Alternative approach: Disable RLS for users table completely
-- Uncomment the following line if you want to disable RLS entirely for users
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify the policies were created
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
