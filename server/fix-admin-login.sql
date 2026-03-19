-- ================================================================
-- CHECK AND FIX ADMIN USER
-- ================================================================

-- First, check if the admin user exists and what their details are
SELECT id, name, email, phone_number, role, verified FROM users WHERE email = 'admin@gmail.com';

-- Check the current user that's trying to access admin
SELECT id, name, email, phone_number, role, verified FROM users WHERE id = '2fc1b0ff-bdfb-4ab9-bafa-9702a0ef08c5';

-- If admin user doesn't exist, create it properly
INSERT INTO users (id, name, email, phone_number, password, role, verified, created_at)
VALUES (
    'admin-user-id-12345',
    'Admin User',
    'admin@gmail.com',
    '+1234567890',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- This is bcrypt hash for '123'
    'admin',
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    verified = EXCLUDED.verified;

-- Verify the admin user was created/updated
SELECT id, name, email, role, verified FROM users WHERE email = 'admin@gmail.com';

-- Also update the current user to have admin email if needed
UPDATE users 
SET email = 'admin@gmail.com', role = 'admin'
WHERE id = '2fc1b0ff-bdfb-4ab9-bafa-9702a0ef08c5';

-- Check the updated user
SELECT id, name, email, phone_number, role, verified FROM users WHERE id = '2fc1b0ff-bdfb-4ab9-bafa-9702a0ef08c5';
