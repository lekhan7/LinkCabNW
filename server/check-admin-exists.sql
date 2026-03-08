-- Check if admin user exists and what's the issue
-- This will help diagnose the admin login problem

-- Check if there's an admin user
SELECT id, email, role, created_at FROM users WHERE email = 'admin@gmail.com';

-- Check all users to see what exists
SELECT id, email, role, created_at FROM users LIMIT 10;

-- Check if the specific user ID from the error exists
SELECT id, email, role, created_at FROM users WHERE id = '7132d2a8-7e8c-4264-8263-b43abf7f2b19';

-- If no admin user exists, create one (uncomment to use)
-- INSERT INTO users (id, email, name, role, phone_number, created_at, updated_at)
-- VALUES (
--   '7132d2a8-7e8c-4264-8263-b43abf7f2b19',
--   'admin@gmail.com',
--   'Admin User',
--   'admin',
--   '+1234567890',
--   NOW(),
--   NOW()
-- );
