-- ================================================================
-- CHECK CURRENT USER EMAIL
-- ================================================================

-- Check what email the current user has
SELECT id, name, email, phone_number, role FROM users WHERE id = '2fc1b0ff-bdfb-4ab9-bafa-9702a0ef08c5';

-- If the user doesn't have admin@gmail.com email, update it
UPDATE users 
SET email = 'admin@gmail.com' 
WHERE id = '2fc1b0ff-bdfb-4ab9-bafa-9702a0ef08c5';

-- Verify the update
SELECT id, name, email, phone_number, role FROM users WHERE id = '2fc1b0ff-bdfb-4ab9-bafa-9702a0ef08c5';
