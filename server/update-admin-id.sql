-- Update the existing admin user to have the correct ID
-- This will fix the ID mismatch between Supabase Auth and users table

-- First, show current admin user details
SELECT id, email, role, created_at FROM users WHERE email = 'admin@gmail.com';

-- Update the existing admin user to have the correct ID from the error
UPDATE users 
SET 
  id = '7132d2a8-7e8c-4264-8263-b43abf7f2b19',
  role = 'admin',
  updated_at = NOW()
WHERE email = 'admin@gmail.com';

-- Verify the update worked
SELECT id, email, role, created_at FROM users WHERE email = 'admin@gmail.com';

-- Show all users to confirm
SELECT id, email, role, created_at FROM users ORDER BY created_at DESC;
