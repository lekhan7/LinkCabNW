-- Check and create admin user if needed
-- This script ensures there's an admin user for testing

-- First, let's see if there are any admin users
SELECT id, email, role, created_at FROM users WHERE role = 'admin';

-- If no admin exists, you can manually create one using the Supabase dashboard
-- or run this insert with a real email/password hash:

-- Example admin user creation (uncomment and modify as needed)
-- INSERT INTO users (id, email, name, role, phone_number, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'admin@linkcab.com',
--   'Admin User',
--   'admin',
--   '+1234567890',
--   NOW(),
--   NOW()
-- );

-- Check current RLS status on users table
SELECT 
  tablename,
  rowsecurity,
  forcerlspolicy
FROM pg_tables 
WHERE tablename = 'users';
