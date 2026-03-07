-- ============================================
-- RLS Policy for Admin Access to Reviews Table
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON reviews;

-- Create policy for admins to view all reviews
CREATE POLICY "Admins can view all reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create policy for admins to delete reviews
CREATE POLICY "Admins can delete reviews" ON reviews
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Optional: Create policy for users to view their own reviews (for completeness)
CREATE POLICY "Users can view reviews they are involved in" ON reviews
    FOR SELECT USING (
        auth.uid() = reviewer_id OR 
        auth.uid() = reviewee_id
    );

-- Optional: Create policy for users to insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id
    );

-- Optional: Create policy for users to update their own reviews
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (
        auth.uid() = reviewer_id
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON reviews TO authenticated;

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
WHERE tablename = 'reviews';
