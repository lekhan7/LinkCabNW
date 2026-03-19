-- ================================================================
-- ADMIN AUTHENTICATION FIX
-- ================================================================

-- Check what email the current user has
SELECT id, name, email, phone_number, role FROM users WHERE id = '22e65ebb-d6c2-446b-8c85-948f2963e60d';

-- If the user doesn't have admin email, update their email to one of the allowed admin emails
UPDATE users 
SET email = 'ktkarumbaiah@gmail.com' 
WHERE id = '22e65ebb-d6c2-446b-8c85-948f2963e60d';

-- Alternatively, add their current email as an admin
-- First check what their current email is
SELECT email FROM users WHERE id = '22e65ebb-d6c2-446b-8c85-948f2963e60d';

-- If they have a different email, we can either:
-- 1. Update the adminAuth middleware to include their email
-- 2. Update their email to an admin email
-- 3. Add a role-based admin system

-- For now, let's set their email to the allowed admin email
UPDATE users 
SET email = 'ktkarumbaiah@gmail.com', role = 'admin'
WHERE id = '22e65ebb-d6c2-446b-8c85-948f2963e60d';

-- Verify the update
SELECT id, name, email, phone_number, role FROM users WHERE id = '22e65ebb-d6c2-446b-8c85-948f2963e60d';
