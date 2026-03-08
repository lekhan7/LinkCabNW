-- Create admin user for login
-- This will create the admin user needed for admin portal access

-- Create admin user with the credentials you want to use
INSERT INTO users (id, email, name, role, phone_number, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@gmail.com',
  'Admin User',
  'admin',
  '+1234567890',
  NOW(),
  NOW()
);

-- Verify admin user was created
SELECT id, email, role, created_at FROM users WHERE email = 'admin@gmail.com';

-- Show all users to confirm
SELECT id, email, role, created_at FROM users ORDER BY created_at DESC;
