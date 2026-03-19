-- ============================================
-- Fix for missing email column in users table
-- ============================================

-- Add email column to users table if it doesn't exist
DO $$
BEGIN
    -- Check if the email column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        -- Add the email column
        ALTER TABLE users 
        ADD COLUMN email VARCHAR(255) UNIQUE NOT NULL DEFAULT '';
        
        -- Create index for email column
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        
        RAISE NOTICE 'Email column added to users table successfully';
    ELSE
        RAISE NOTICE 'Email column already exists in users table';
    END IF;
END $$;

-- Update existing users to have unique email if they don't have one
UPDATE users 
SET email = 'user_' || id::text || '@temp.linkcab.com' 
WHERE email = '' OR email IS NULL;

-- Set the column to NOT NULL after updating existing records
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL;

-- Add unique constraint
ALTER TABLE users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Update the main schema file to include email column
-- This is for documentation purposes
COMMENT ON COLUMN users.email IS 'User email address - unique identifier';
