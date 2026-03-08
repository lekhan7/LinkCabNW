-- Check the specific user ID from the error and fix the issue
-- The error shows user ID: 7132d2a8-7e8c-4264-8263-b43abf7f2b19

-- Check if this specific user exists and what role they have
SELECT id, email, role, created_at FROM users WHERE id = '7132d2a8-7e8c-4264-8263-b43abf7f2b19';

-- Check if admin@gmail.com user exists
SELECT id, email, role, created_at FROM users WHERE email = 'admin@gmail.com';

-- Show all users to see what we have
SELECT id, email, role, created_at FROM users ORDER BY created_at DESC;

-- If the admin user doesn't exist with the right ID, let's create it with the exact ID from error
INSERT INTO users (id, email, name, role, phone_number, password, created_at, updated_at)
VALUES (
  '7132d2a8-7e8c-4264-8263-b43abf7f2b19',
  'admin@gmail.com',
  'Admin User',
  'admin',
  '+1234567890',
  '123',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = 'admin@gmail.com',
  updated_at = NOW();
