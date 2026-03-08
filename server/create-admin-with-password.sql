-- Create admin user with password
-- This includes the password field that was missing

INSERT INTO users (id, email, name, role, phone_number, password, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@gmail.com',
  'Admin User',
  'admin',
  '+1234567890',
  '123', -- Plain text password for now
  NOW(),
  NOW()
);

-- Verify admin user was created
SELECT id, email, role, created_at FROM users WHERE email = 'admin@gmail.com';

-- Show all users to confirm
SELECT id, email, role, created_at FROM users ORDER BY created_at DESC;
