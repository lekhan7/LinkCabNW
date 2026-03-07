# Manual RLS Policies Setup

Since automatic execution might have permission issues, here's how to manually apply the RLS policies:

## Step 1: Apply RLS Policies

Run the following SQL in your Supabase SQL Editor:

```sql
-- First, create the admin check function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
        AND verified = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated, anon;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_travel_places ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Create admin policies for users table
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all users" ON users FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (is_admin_user());

-- Drop existing admin policies for announcements
DROP POLICY IF EXISTS "Admins can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;

-- Create admin policies for announcements table
CREATE POLICY "Admins can view all announcements" ON announcements FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all announcements" ON announcements FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all announcements" ON announcements FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert announcements" ON announcements FOR INSERT WITH CHECK (is_admin_user());

-- Similar policies for other tables...
DROP POLICY IF EXISTS "Admins can view all review details" ON review_details;
CREATE POLICY "Admins can view all review details" ON review_details FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all review details" ON review_details FOR UPDATE USING (is_admin_user());
CREATE POLICY "Admins can delete all review details" ON review_details FOR DELETE USING (is_admin_user());
CREATE POLICY "Admins can insert review details" ON review_details FOR INSERT WITH CHECK (is_admin_user());
```

## Step 2: Verify Your Admin User

Make sure your user account has admin role:

```sql
-- Check your current user role
SELECT id, email, role, verified FROM users WHERE id = auth.uid();

-- Update your user to admin if needed
UPDATE users SET role = 'admin', verified = true WHERE id = auth.uid();
```

## Step 3: Test the Policies

Try these queries to verify the policies work:

```sql
-- Test admin access (should return data if you're admin)
SELECT COUNT(*) FROM announcements;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM review_details;
```

## Step 4: Fix Foreign Key Constraints

If you're still getting foreign key errors, the comprehensive delete in AdminUsers.jsx should handle it. The delete order is:

1. announcement_participants
2. ride_shares  
3. review_details (as reviewer)
4. review_details (as reviewee)
5. ratings
6. rides
7. announcements
8. notifications
9. connection_requests
10. favorite_routes
11. preferred_locations
12. preferred_travel_places
13. payments
14. users (finally)

## Alternative: Disable RLS Temporarily

If you need immediate access, you can temporarily disable RLS:

```sql
-- WARNING: This removes all row-level security!
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
-- ... disable for other tables as needed
```

Remember to re-enable RLS after fixing the policies!
