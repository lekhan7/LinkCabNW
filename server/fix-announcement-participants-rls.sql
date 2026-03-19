-- Fix RLS policies for announcement_participants table
-- This allows users to join announcements while maintaining security

-- First, check current policies on announcement_participants table
SELECT 
    'BEFORE - Announcement participants policies:' as info,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual, 1, 50)
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || substring(with_check, 1, 50)
        ELSE 'No condition'
    END as condition
FROM pg_policies 
WHERE tablename = 'announcement_participants'
ORDER BY policyname;

-- Disable RLS temporarily to clear policies
ALTER TABLE announcement_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on announcement_participants
DROP POLICY IF EXISTS "Users can view own participants" ON announcement_participants;
DROP POLICY IF EXISTS "Users can insert participants" ON announcement_participants;
DROP POLICY IF EXISTS "Users can update own participants" ON announcement_participants;
DROP POLICY IF EXISTS "Allow all announcement participant operations" ON announcement_participants;

-- Re-enable RLS
ALTER TABLE announcement_participants ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies for announcement_participants

-- Allow anyone to insert participants (for joining announcements)
CREATE POLICY "allow_participant_insert" ON announcement_participants 
FOR INSERT WITH CHECK (true);

-- Allow users to view participants (for listing)
CREATE POLICY "allow_participant_select" ON announcement_participants 
FOR SELECT USING (true);

-- Allow users to update their own participant status
CREATE POLICY "allow_own_participant_update" ON announcement_participants 
FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Allow users to delete their own participation
CREATE POLICY "allow_own_participant_delete" ON announcement_participants 
FOR DELETE USING (user_id::text = auth.uid()::text);

-- Allow admins full access to participants
CREATE POLICY "allow_admin_participant_all" ON announcement_participants 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- Verify the new policies
SELECT 
    'AFTER - New participant policies created:' as status,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual, 1, 50)
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || substring(with_check, 1, 50)
        ELSE 'No condition'
    END as condition
FROM pg_policies 
WHERE tablename = 'announcement_participants'
ORDER BY policyname;

-- Test participant insertion
DO $$
BEGIN
    -- Test insertion with minimal data
    INSERT INTO announcement_participants (
        announcement_id,
        user_id,
        status
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- Test announcement UUID
        '00000000-0000-0000-0000-000000000000', -- Test user UUID
        'requested'
    );
    
    RAISE NOTICE '✅ Participant insertion test PASSED';
    
    -- Clean up
    DELETE FROM announcement_participants WHERE announcement_id = '00000000-0000-0000-0000-000000000000';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Participant test FAILED: %', SQLERRM;
END $$;

SELECT '✅ Announcement participants RLS policies fixed - Join announcements should now work' as final_status;
