-- ============================================
-- RLS Policy for Admin Access to Announcements Table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;

-- Create policy for admins to view all announcements
CREATE POLICY "Admins can view all announcements" ON announcements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create policy for admins to delete announcements
CREATE POLICY "Admins can delete announcements" ON announcements
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create policy for admins to update announcements
CREATE POLICY "Admins can update announcements" ON announcements
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Keep existing user policies for regular users
CREATE POLICY "Users can view announcements" ON announcements
    FOR SELECT USING (
        ride_completed = false
    );

CREATE POLICY "Users can create announcements" ON announcements
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
    );

CREATE POLICY "Users can update own announcements" ON announcements
    FOR UPDATE USING (
        auth.uid() = created_by
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON announcements TO authenticated;

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'announcements';
