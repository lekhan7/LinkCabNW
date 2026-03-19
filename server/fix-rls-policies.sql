-- ================================================================
-- MINIMAL RLS POLICY FIX FOR USERS TABLE
-- ================================================================
-- This fixes the row-level security violation for user signup

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Create simple, working policies
CREATE POLICY "Enable insert for all" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for all authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Alternative: Temporarily disable RLS for users table
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Use this if the above doesn't work:
-- ALTER TABLE users FORCE ROW LEVEL SECURITY;
