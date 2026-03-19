-- ================================================================
-- COMPLETE RLS DISABLE FIX FOR USERS TABLE
-- ================================================================
-- This completely disables RLS on users table to fix signup

-- Disable RLS entirely for users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Alternative: Drop all policies on users table
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Enable insert for all" ON users;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for own data" ON users;

-- If still doesn't work, try this:
-- TRUNCATE TABLE users CASCADE;
-- Then re-run the complete schema
