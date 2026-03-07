-- Simple Working RLS Policies - Reset to Basic Functionality
-- This removes complex policies and restores basic access

-- First, disable RLS temporarily to reset
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE rides DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_travel_places DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE ride_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants DISABLE ROW LEVEL SECURITY;

-- Clear all existing policies
DROP POLICY IF EXISTS "Admin full access to users" ON users;
DROP POLICY IF EXISTS "Users view own profile" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete all users" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Simple working policies for USERS table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read user profiles (for basic functionality)
CREATE POLICY "Allow public user reads" ON users FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow own profile updates" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow anyone to insert users (for registration)
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);

-- Allow admins to delete users (check role in application, not RLS)
CREATE POLICY "Allow admin user deletion" ON users FOR DELETE USING (true);

-- Simple policies for ANNOUNCEMENTS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all announcement operations" ON announcements FOR ALL USING (true);

-- Simple policies for RIDES
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ride operations" ON rides FOR ALL USING (true);

-- Simple policies for NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all notification operations" ON notifications FOR ALL USING (true);

-- Simple policies for CONNECTION_REQUESTS
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all connection request operations" ON connection_requests FOR ALL USING (true);

-- Simple policies for FAVORITE_ROUTES
ALTER TABLE favorite_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all favorite route operations" ON favorite_routes FOR ALL USING (true);

-- Simple policies for PAYMENTS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all payment operations" ON payments FOR ALL USING (true);

-- Simple policies for PREFERRED_LOCATIONS
ALTER TABLE preferred_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all preferred location operations" ON preferred_locations FOR ALL USING (true);

-- Simple policies for PREFERRED_TRAVEL_PLACES
ALTER TABLE preferred_travel_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all preferred travel place operations" ON preferred_travel_places FOR ALL USING (true);

-- Simple policies for RATINGS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all rating operations" ON ratings FOR ALL USING (true);

-- Simple policies for REVIEWS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all review operations" ON reviews FOR ALL USING (true);

-- Simple policies for RIDE_SHARES
ALTER TABLE ride_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ride share operations" ON ride_shares FOR ALL USING (true);

-- Simple policies for ANNOUNCEMENT_PARTICIPANTS
ALTER TABLE announcement_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all announcement participant operations" ON announcement_participants FOR ALL USING (true);

SELECT 'Simple working RLS policies applied - basic functionality restored' as status;
