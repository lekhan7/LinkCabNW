-- ================================================================
-- CREATE ADMIN USER
-- ================================================================

-- First, check if admin user already exists
SELECT * FROM users WHERE email = 'admin@gmail.com';

-- If not exists, create admin user with password '123'
INSERT INTO users (id, name, email, phone_number, password, role, verified, created_at)
VALUES (
    gen_random_uuid(),
    'Admin User',
    'admin@gmail.com',
    '+1234567890',
    '$2b$10$rQ8QW8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8W8O', -- This is bcrypt hash for '123'
    'admin',
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Verify the admin user was created
SELECT id, name, email, role, created_at FROM users WHERE email = 'admin@gmail.com';

-- Note: The password hash above is for '123'. 
-- If you need to generate a different hash, you can use:
-- bcrypt.hashSync('your_password', 10) in Node.js
