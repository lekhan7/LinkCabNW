-- ============================================
-- COMPLETE LINKCAB DATABASE SETUP
-- Tables + RLS Policies + Admin Control
-- ============================================

-- ============================================
-- STEP 1: DROP EVERYTHING (Clean Slate)
-- ============================================

-- Drop views first
DROP VIEW IF EXISTS user_profiles CASCADE;
DROP VIEW IF EXISTS announcement_summary CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_expired_otps() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_app_settings() CASCADE;
DROP FUNCTION IF EXISTS update_user_rating(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_available_seats(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS owns_announcement(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_participant_in_announcement(UUID) CASCADE;

-- Drop tables in correct order
DROP TABLE IF EXISTS connection_requests CASCADE;
DROP TABLE IF EXISTS favorite_routes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS ride_shares CASCADE;
DROP TABLE IF EXISTS rides CASCADE;
DROP TABLE IF EXISTS announcement_completion_status CASCADE;
DROP TABLE IF EXISTS announcement_participants CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS preferred_locations CASCADE;
DROP TABLE IF EXISTS preferred_travel_places CASCADE;
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- ============================================
-- STEP 2: ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- STEP 3: CREATE ALL TABLES
-- ============================================

-- APP SETTINGS TABLE
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_primary_color VARCHAR(7) DEFAULT '#3B82F6',
    theme_secondary_color VARCHAR(7) DEFAULT '#10B981',
    theme_accent_color VARCHAR(7) DEFAULT '#F59E0B',
    theme_background_color VARCHAR(7) DEFAULT '#FFFFFF',
    theme_text_color VARCHAR(7) DEFAULT '#1F2937',
    theme_error_color VARCHAR(7) DEFAULT '#EF4444',
    theme_success_color VARCHAR(7) DEFAULT '#10B981',
    terms_and_conditions TEXT DEFAULT 'Default Terms and Conditions content. Please update with your actual terms.',
    privacy_policy TEXT DEFAULT 'Default Privacy Policy content. Please update with your actual privacy policy.',
    about_us TEXT DEFAULT 'Default About Us content. Please update with your actual information.',
    app_name VARCHAR(50) DEFAULT 'LinkCab',
    app_version VARCHAR(10) DEFAULT '1.0.0',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    allow_new_registrations BOOLEAN DEFAULT TRUE,
    require_phone_verification BOOLEAN DEFAULT TRUE,
    max_ride_distance INTEGER DEFAULT 500,
    min_ride_price DECIMAL(10,2) DEFAULT 5.00,
    max_ride_price DECIMAL(10,2) DEFAULT 1000.00,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    booking_reminders BOOLEAN DEFAULT TRUE,
    promotional_emails BOOLEAN DEFAULT FALSE,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_gateway VARCHAR(20) DEFAULT 'stripe',
    commission_rate DECIMAL(5,4) DEFAULT 0.1000,
    min_withdrawal_amount DECIMAL(10,2) DEFAULT 10.00,
    password_min_length INTEGER DEFAULT 6,
    session_timeout INTEGER DEFAULT 24,
    max_login_attempts INTEGER DEFAULT 5,
    lockout_duration INTEGER DEFAULT 15,
    rate_limit_window INTEGER DEFAULT 15,
    rate_limit_max INTEGER DEFAULT 200,
    enable_cors BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    profile_picture TEXT DEFAULT '',
    average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
    completed_trips INTEGER DEFAULT 0,
    total_trips INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_premium BOOLEAN DEFAULT FALSE,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_manage_settings BOOLEAN DEFAULT FALSE,
    can_manage_content BOOLEAN DEFAULT FALSE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_online ON users(is_online);
CREATE INDEX idx_users_last_active ON users(last_active);

-- ADMINS TABLE
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);

-- PREFERRED TRAVEL PLACES TABLE
CREATE TABLE preferred_travel_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_preferred_places_user_id ON preferred_travel_places(user_id);

-- PREFERRED LOCATIONS TABLE
CREATE TABLE preferred_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_preferred_locations_user_id ON preferred_locations(user_id);

-- ANNOUNCEMENTS TABLE
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(id),
    start_location_name VARCHAR(255) NOT NULL,
    start_location GEOGRAPHY(POINT, 4326) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    destination GEOGRAPHY(POINT, 4326) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    passenger_capacity INTEGER NOT NULL CHECK (passenger_capacity >= 1 AND passenger_capacity <= 7),
    vehicle_type VARCHAR(50) DEFAULT 'personal_car',
    comfort_level VARCHAR(20) DEFAULT 'comfortable' CHECK (comfort_level IN ('basic', 'comfortable', 'premium')),
    seat_preference VARCHAR(20) DEFAULT 'partial-sharing' CHECK (seat_preference IN ('no-sharing', 'partial-sharing', 'full-sharing')),
    route_type VARCHAR(20) DEFAULT 'daily-route' CHECK (route_type IN ('daily-route', 'self-car')),
    smoking_preference VARCHAR(20) DEFAULT '',
    alcohol_preference VARCHAR(20) DEFAULT '',
    music_preference VARCHAR(20) DEFAULT '',
    conversation_preference VARCHAR(20) DEFAULT '',
    pets_preference VARCHAR(20) DEFAULT '',
    ac_preference VARCHAR(20) DEFAULT '',
    luggage_preference VARCHAR(20) DEFAULT '',
    gender_preference VARCHAR(20) DEFAULT '',
    notes TEXT DEFAULT '',
    ride_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for announcements
CREATE INDEX idx_announcements_created_by ON announcements(created_by);
CREATE INDEX idx_announcements_date ON announcements(date);
CREATE INDEX idx_announcements_price ON announcements(price);
CREATE INDEX idx_announcements_vehicle_type ON announcements(vehicle_type);
CREATE INDEX idx_announcements_ride_completed ON announcements(ride_completed);

-- Geospatial indexes
CREATE INDEX idx_announcements_start_location ON announcements USING GIST(start_location);
CREATE INDEX idx_announcements_destination ON announcements USING GIST(destination);

-- ANNOUNCEMENT PARTICIPANTS TABLE
CREATE TABLE announcement_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'pending', 'accepted', 'rejected', 'completed')),
    paid BOOLEAN DEFAULT FALSE,
    chat_id UUID,
    UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_announcement_participants_announcement ON announcement_participants(announcement_id);
CREATE INDEX idx_announcement_participants_user ON announcement_participants(user_id);
CREATE INDEX idx_announcement_participants_status ON announcement_participants(status);

-- ANNOUNCEMENT COMPLETION STATUS TABLE
CREATE TABLE announcement_completion_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    reviewed BOOLEAN DEFAULT FALSE,
    UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_completion_status_announcement ON announcement_completion_status(announcement_id);
CREATE INDEX idx_completion_status_user ON announcement_completion_status(user_id);

-- RIDES TABLE
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    source_name VARCHAR(255) NOT NULL,
    source_lat DECIMAL(10,8) NOT NULL,
    source_lng DECIMAL(11,8) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    destination_lat DECIMAL(10,8) NOT NULL,
    destination_lng DECIMAL(11,8) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    travel_mode VARCHAR(10) NOT NULL CHECK (travel_mode IN ('car', 'auto', 'public')),
    status VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked', 'ongoing', 'completed', 'cancelled')),
    type VARCHAR(20) DEFAULT 'SELF_BOOKED',
    is_shared BOOLEAN DEFAULT FALSE,
    estimated_cost DECIMAL(10,2) NOT NULL CHECK (estimated_cost >= 0),
    actual_cost DECIMAL(10,2),
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rides_user_id ON rides(user_id);
CREATE INDEX idx_rides_date ON rides(date);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_travel_mode ON rides(travel_mode);

-- RIDE SHARES TABLE
CREATE TABLE ride_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    UNIQUE(ride_id, user_id)
);

CREATE INDEX idx_ride_shares_ride ON ride_shares(ride_id);
CREATE INDEX idx_ride_shares_user ON ride_shares(user_id);
CREATE INDEX idx_ride_shares_status ON ride_shares(status);

-- PAYMENTS TABLE
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    announcement_id UUID NOT NULL REFERENCES announcements(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('razorpay', 'stripe', 'mock')),
    transaction_id VARCHAR(255) UNIQUE,
    gateway_response JSONB,
    purpose VARCHAR(20) DEFAULT 'verification' CHECK (purpose IN ('verification', 'connection', 'join_fee')),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_announcement_id ON payments(announcement_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_purpose ON payments(purpose);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('chat_joined', 'new_message', 'announcement_joined', 'preferred_place_match', 'join_request', 'join_accepted', 'join_rejected', 'JOIN_REQUEST_ACCEPTED', 'FAVORITE_ROUTE_MATCH', 'FAVORITE_RIDE_REPOST', 'NEW_REVIEW')),
    title VARCHAR(100) NOT NULL,
    message VARCHAR(500) NOT NULL,
    announcement_id UUID REFERENCES announcements(id),
    related_announcement_id UUID REFERENCES announcements(id),
    related_chat_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    request_id UUID,
    related_user_phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_sender ON notifications(sender_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- RATINGS TABLE
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    announcement_id UUID NOT NULL REFERENCES announcements(id),
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    review VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_user_id, to_user_id, announcement_id),
    CHECK (from_user_id != to_user_id)
);

CREATE INDEX idx_ratings_from_user ON ratings(from_user_id);
CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);
CREATE INDEX idx_ratings_announcement ON ratings(announcement_id);
CREATE INDEX idx_ratings_stars ON ratings(stars);

-- REVIEWS TABLE
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES announcements(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, reviewer_id)
);

CREATE INDEX idx_reviews_ride ON reviews(ride_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- FAVORITE ROUTES TABLE
CREATE TABLE favorite_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    announcement_id UUID NOT NULL REFERENCES announcements(id),
    from_location VARCHAR(100) NOT NULL,
    to_location VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, announcement_id)
);

CREATE INDEX idx_favorite_routes_user ON favorite_routes(user_id);
CREATE INDEX idx_favorite_routes_created_by ON favorite_routes(created_by);
CREATE INDEX idx_favorite_routes_to_location ON favorite_routes(to_location);

-- CONNECTION REQUESTS TABLE
CREATE TABLE connection_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    announcement_id UUID NOT NULL REFERENCES announcements(id),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_user_id, to_user_id, announcement_id)
);

CREATE INDEX idx_connection_requests_from_user ON connection_requests(from_user_id);
CREATE INDEX idx_connection_requests_to_user ON connection_requests(to_user_id);
CREATE INDEX idx_connection_requests_announcement ON connection_requests(announcement_id);
CREATE INDEX idx_connection_requests_status ON connection_requests(status);

-- OTPS TABLE
CREATE TABLE otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes'),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otps_phone_number ON otps(phone_number);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);

-- ============================================
-- STEP 4: CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_favorite_routes_updated_at BEFORE UPDATE ON favorite_routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connection_requests_updated_at BEFORE UPDATE ON connection_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_otps_updated_at BEFORE UPDATE ON otps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferred_travel_places_updated_at BEFORE UPDATE ON preferred_travel_places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferred_locations_updated_at BEFORE UPDATE ON preferred_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcement_participants_updated_at BEFORE UPDATE ON announcement_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcement_completion_status_updated_at BEFORE UPDATE ON announcement_completion_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ride_shares_updated_at BEFORE UPDATE ON ride_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: INSERT DEFAULT DATA
-- ============================================

-- Insert default app settings using INSERT ... ON CONFLICT
INSERT INTO app_settings (theme_primary_color, theme_secondary_color, app_name) 
VALUES ('#3B82F6', '#10B981', 'LinkCab')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 6: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_travel_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferred_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_completion_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 7: CREATE ADMIN RLS POLICIES
-- ============================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admins 
        WHERE id = auth.uid() AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
-- Admins can do ANYTHING with users
CREATE POLICY "Admins full control on users" ON users FOR ALL USING (
    is_admin()
);

-- Users can view their own profile
CREATE POLICY "Users view own profile" ON users FOR SELECT USING (
    auth.uid()::text = id::text
);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (
    auth.uid()::text = id::text
);

-- Users can insert their own profile (registration)
CREATE POLICY "Users insert own profile" ON users FOR INSERT WITH CHECK (
    auth.uid()::text = id::text
);

-- ADMINS TABLE POLICIES
-- Admins can do ANYTHING with admins
CREATE POLICY "Admins full control on admins" ON admins FOR ALL USING (
    is_admin()
);

-- ANNOUNCEMENTS TABLE POLICIES
-- Admins can do ANYTHING with announcements
CREATE POLICY "Admins full control on announcements" ON announcements FOR ALL USING (
    is_admin()
);

-- Users can view all announcements (public access)
CREATE POLICY "Users view all announcements" ON announcements FOR SELECT USING (
    TRUE
);

-- Users can create announcements
CREATE POLICY "Users create announcements" ON announcements FOR INSERT WITH CHECK (
    created_by = auth.uid()
);

-- Users can update their own announcements
CREATE POLICY "Users update own announcements" ON announcements FOR UPDATE USING (
    created_by = auth.uid()
);

-- Users can delete their own announcements
CREATE POLICY "Users delete own announcements" ON announcements FOR DELETE USING (
    created_by = auth.uid()
);

-- ANNOUNCEMENT PARTICIPANTS TABLE POLICIES
-- Admins can do ANYTHING with participants
CREATE POLICY "Admins full control on participants" ON announcement_participants FOR ALL USING (
    is_admin()
);

-- Users can view participants for announcements they own or participate in
CREATE POLICY "Users view relevant participants" ON announcement_participants FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM announcements 
        WHERE id = announcement_id AND created_by = auth.uid()
    )
);

-- Users can join announcements
CREATE POLICY "Users join announcements" ON announcement_participants FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Users can update their own participation status
CREATE POLICY "Users update own participation" ON announcement_participants FOR UPDATE USING (
    user_id = auth.uid()
);

-- Users can leave announcements
CREATE POLICY "Users leave announcements" ON announcement_participants FOR DELETE USING (
    user_id = auth.uid()
);

-- RIDES TABLE POLICIES
-- Admins can do ANYTHING with rides
CREATE POLICY "Admins full control on rides" ON rides FOR ALL USING (
    is_admin()
);

-- Users can view their own rides
CREATE POLICY "Users view own rides" ON rides FOR SELECT USING (
    user_id = auth.uid()
);

-- Users can create rides
CREATE POLICY "Users create rides" ON rides FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Users can update their own rides
CREATE POLICY "Users update own rides" ON rides FOR UPDATE USING (
    user_id = auth.uid()
);

-- Users can delete their own rides
CREATE POLICY "Users delete own rides" ON rides FOR DELETE USING (
    user_id = auth.uid()
);

-- PAYMENTS TABLE POLICIES
-- Admins can do ANYTHING with payments
CREATE POLICY "Admins full control on payments" ON payments FOR ALL USING (
    is_admin()
);

-- Users can view their own payments
CREATE POLICY "Users view own payments" ON payments FOR SELECT USING (
    user_id = auth.uid()
);

-- Users can create payments
CREATE POLICY "Users create payments" ON payments FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Users can update their own payments
CREATE POLICY "Users update own payments" ON payments FOR UPDATE USING (
    user_id = auth.uid()
);

-- NOTIFICATIONS TABLE POLICIES
-- Admins can do ANYTHING with notifications
CREATE POLICY "Admins full control on notifications" ON notifications FOR ALL USING (
    is_admin()
);

-- Users can view notifications sent to them
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (
    recipient_id = auth.uid()
);

-- Users can create notifications
CREATE POLICY "Users create notifications" ON notifications FOR INSERT WITH CHECK (
    sender_id = auth.uid()
);

-- Users can update notifications sent to them
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (
    recipient_id = auth.uid()
);

-- RATINGS TABLE POLICIES
-- Admins can do ANYTHING with ratings
CREATE POLICY "Admins full control on ratings" ON ratings FOR ALL USING (
    is_admin()
);

-- Users can view ratings they gave or received
CREATE POLICY "Users view relevant ratings" ON ratings FOR SELECT USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
);

-- Users can create ratings
CREATE POLICY "Users create ratings" ON ratings FOR INSERT WITH CHECK (
    from_user_id = auth.uid()
);

-- Users can update ratings they gave
CREATE POLICY "Users update own ratings" ON ratings FOR UPDATE USING (
    from_user_id = auth.uid()
);

-- OTPS TABLE POLICIES
-- Admins can do ANYTHING with OTPs
CREATE POLICY "Admins full control on otps" ON otps FOR ALL USING (
    is_admin()
);

-- Users can view OTPs for their phone number
CREATE POLICY "Users view own otps" ON otps FOR SELECT USING (
    phone_number IN (
        SELECT phone_number FROM users WHERE id = auth.uid()
    )
);

-- Users can create OTPs
CREATE POLICY "Users create otps" ON otps FOR INSERT WITH CHECK (
    phone_number IN (
        SELECT phone_number FROM users WHERE id = auth.uid()
    )
);

-- APP SETTINGS TABLE POLICIES
-- Admins can do ANYTHING with app settings
CREATE POLICY "Admins full control on app settings" ON app_settings FOR ALL USING (
    is_admin()
);

-- Users can only view app settings (read-only)
CREATE POLICY "Users view app settings" ON app_settings FOR SELECT USING (
    TRUE
);

-- PREFERRED TRAVEL PLACES TABLE POLICIES
-- Admins can do ANYTHING with preferred travel places
CREATE POLICY "Admins full control on preferred travel places" ON preferred_travel_places FOR ALL USING (
    is_admin()
);

-- Users can view their own preferred travel places
CREATE POLICY "Users view own preferred travel places" ON preferred_travel_places FOR SELECT USING (
    user_id = auth.uid()
);

-- Users can create preferred travel places
CREATE POLICY "Users create preferred travel places" ON preferred_travel_places FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Users can update their own preferred travel places
CREATE POLICY "Users update own preferred travel places" ON preferred_travel_places FOR UPDATE USING (
    user_id = auth.uid()
);

-- Users can delete their own preferred travel places
CREATE POLICY "Users delete own preferred travel places" ON preferred_travel_places FOR DELETE USING (
    user_id = auth.uid()
);

-- PREFERRED LOCATIONS TABLE POLICIES
-- Admins can do ANYTHING with preferred locations
CREATE POLICY "Admins full control on preferred locations" ON preferred_locations FOR ALL USING (
    is_admin()
);

-- Users can view their own preferred locations
CREATE POLICY "Users view own preferred locations" ON preferred_locations FOR SELECT USING (
    user_id = auth.uid()
);

-- Users can create preferred locations
CREATE POLICY "Users create preferred locations" ON preferred_locations FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Users can update their own preferred locations
CREATE POLICY "Users update own preferred locations" ON preferred_locations FOR UPDATE USING (
    user_id = auth.uid()
);

-- Users can delete their own preferred locations
CREATE POLICY "Users delete own preferred locations" ON preferred_locations FOR DELETE USING (
    user_id = auth.uid()
);

-- FAVORITE ROUTES TABLE POLICIES
-- Admins can do ANYTHING with favorite routes
CREATE POLICY "Admins full control on favorite routes" ON favorite_routes FOR ALL USING (
    is_admin()
);

-- Users can view their own favorite routes
CREATE POLICY "Users view own favorite routes" ON favorite_routes FOR SELECT USING (
    user_id = auth.uid()
);

-- Users can create favorite routes
CREATE POLICY "Users create favorite routes" ON favorite_routes FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- CONNECTION REQUESTS TABLE POLICIES
-- Admins can do ANYTHING with connection requests
CREATE POLICY "Admins full control on connection requests" ON connection_requests FOR ALL USING (
    is_admin()
);

-- Users can view connection requests they sent or received
CREATE POLICY "Users view relevant connection requests" ON connection_requests FOR SELECT USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
);

-- Users can create connection requests
CREATE POLICY "Users create connection requests" ON connection_requests FOR INSERT WITH CHECK (
    from_user_id = auth.uid()
);

-- REVIEWS TABLE POLICIES
-- Admins can do ANYTHING with reviews
CREATE POLICY "Admins full control on reviews" ON reviews FOR ALL USING (
    is_admin()
);

-- Users can view reviews they wrote or received
CREATE POLICY "Users view relevant reviews" ON reviews FOR SELECT USING (
    reviewer_id = auth.uid() OR reviewee_id = auth.uid()
);

-- Users can create reviews
CREATE POLICY "Users create reviews" ON reviews FOR INSERT WITH CHECK (
    reviewer_id = auth.uid()
);

-- ANNOUNCEMENT COMPLETION STATUS TABLE POLICIES
-- Admins can do ANYTHING with completion status
CREATE POLICY "Admins full control on completion status" ON announcement_completion_status FOR ALL USING (
    is_admin()
);

-- Users can view completion status for their announcements
CREATE POLICY "Users view own completion status" ON announcement_completion_status FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM announcements 
        WHERE id = announcement_id AND created_by = auth.uid()
    )
);

-- Users can create completion status
CREATE POLICY "Users create completion status" ON announcement_completion_status FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- ============================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Enable RLS bypass for service role (for backend operations)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- ============================================
-- COMPLETE!
-- ============================================

-- Your LinkCab database is now fully set up with:
-- ✅ All tables created with proper relationships
-- ✅ Admins have FULL CONTROL over everything
-- ✅ Users have limited access to their own data
-- ✅ RLS policies enforced
-- ✅ Indexes for performance
-- ✅ Triggers for timestamps
-- ✅ Default data inserted
