-- ============================================
-- LinkCab Supabase Database Schema - Safe Creation
-- Handles existing data gracefully
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial data
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- DROP TABLES IF EXIST (in correct order)
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

-- Drop tables in correct order (respecting foreign keys)
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
-- USERS TABLE
-- ============================================
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

-- ============================================
-- PREFERRED TRAVEL PLACES
-- ============================================
CREATE TABLE preferred_travel_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_preferred_places_user_id ON preferred_travel_places(user_id);

-- ============================================
-- PREFERRED LOCATIONS
-- ============================================
CREATE TABLE preferred_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_preferred_locations_user_id ON preferred_locations(user_id);

-- ============================================
-- ADMIN TABLE
-- ============================================
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

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
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

-- ============================================
-- ANNOUNCEMENT PARTICIPANTS
-- ============================================
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

-- ============================================
-- ANNOUNCEMENT COMPLETION STATUS
-- ============================================
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

-- ============================================
-- RIDES TABLE
-- ============================================
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

-- Indexes for rides
CREATE INDEX idx_rides_user_id ON rides(user_id);
CREATE INDEX idx_rides_date ON rides(date);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_travel_mode ON rides(travel_mode);

-- ============================================
-- RIDE SHARED WITH
-- ============================================
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

-- ============================================
-- PAYMENTS TABLE
-- ============================================
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

-- Indexes for payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_announcement_id ON payments(announcement_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_purpose ON payments(purpose);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
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

-- Indexes for notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_sender ON notifications(sender_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- ============================================
-- RATINGS TABLE
-- ============================================
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

-- Indexes for ratings
CREATE INDEX idx_ratings_from_user ON ratings(from_user_id);
CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);
CREATE INDEX idx_ratings_announcement ON ratings(announcement_id);
CREATE INDEX idx_ratings_stars ON ratings(stars);

-- ============================================
-- REVIEWS TABLE
-- ============================================
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

-- Indexes for reviews
CREATE INDEX idx_reviews_ride ON reviews(ride_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================
-- FAVORITE ROUTES TABLE
-- ============================================
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

-- Indexes for favorite routes
CREATE INDEX idx_favorite_routes_user ON favorite_routes(user_id);
CREATE INDEX idx_favorite_routes_created_by ON favorite_routes(created_by);
CREATE INDEX idx_favorite_routes_to_location ON favorite_routes(to_location);

-- ============================================
-- CONNECTION REQUESTS TABLE
-- ============================================
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

-- Indexes for connection requests
CREATE INDEX idx_connection_requests_from_user ON connection_requests(from_user_id);
CREATE INDEX idx_connection_requests_to_user ON connection_requests(to_user_id);
CREATE INDEX idx_connection_requests_announcement ON connection_requests(announcement_id);
CREATE INDEX idx_connection_requests_status ON connection_requests(status);

-- ============================================
-- OTP TABLE
-- ============================================
CREATE TABLE otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes'),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for OTPs
CREATE INDEX idx_otps_phone_number ON otps(phone_number);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);

-- ============================================
-- APP SETTINGS TABLE
-- ============================================
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

-- ============================================
-- TRIGGERS FOR UPDATED_AT
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
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================

-- Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
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

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Admin policies
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for user with aggregated data
CREATE VIEW user_profiles AS
SELECT 
    u.*,
    COALESCE(AVG(r.stars), 0) as calculated_average_rating,
    COUNT(DISTINCT r.id) as total_ratings_given,
    COUNT(DISTINCT r2.id) as total_ratings_received,
    COUNT(DISTINCT a.id) as total_announcements,
    COUNT(DISTINCT ap.id) as total_participations
FROM users u
LEFT JOIN ratings r ON r.from_user_id = u.id
LEFT JOIN ratings r2 ON r2.to_user_id = u.id
LEFT JOIN announcements a ON a.created_by = u.id
LEFT JOIN announcement_participants ap ON ap.user_id = u.id
GROUP BY u.id;

-- View for announcements with participant count
CREATE VIEW announcement_summary AS
SELECT 
    a.*,
    COUNT(ap.id) as current_participants,
    a.passenger_capacity - COUNT(ap.id) as available_seats
FROM announcements a
LEFT JOIN announcement_participants ap ON a.id = ap.announcement_id AND ap.status = 'accepted'
GROUP BY a.id;

-- ============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================

-- Function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating(user_uuid UUID, new_rating INTEGER)
RETURNS void AS $$
DECLARE
    total_ratings INTEGER;
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT COUNT(*), AVG(stars) INTO total_ratings, avg_rating
    FROM ratings WHERE to_user_id = user_uuid;
    
    UPDATE users 
    SET 
        average_rating = COALESCE(avg_rating, 0),
        total_trips = total_ratings
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to check available seats in announcement
CREATE OR REPLACE FUNCTION get_available_seats(announcement_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    capacity INTEGER;
    participants INTEGER;
BEGIN
    SELECT passenger_capacity INTO capacity FROM announcements WHERE id = announcement_uuid;
    SELECT COUNT(*) INTO participants FROM announcement_participants 
    WHERE announcement_id = announcement_uuid AND status = 'accepted';
    
    RETURN capacity - participants;
END;
$$ LANGUAGE plpgsql;

-- Auto-delete expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM otps WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default app settings (safe insert - only if table is empty)
INSERT INTO app_settings (theme_primary_color, theme_secondary_color, app_name) 
VALUES ('#3B82F6', '#10B981', 'LinkCab')
WHERE NOT EXISTS (SELECT 1 FROM app_settings LIMIT 1);

-- ============================================
-- PERFORMANCE OPTIMIZATION
-- ============================================

-- Create partial indexes for common queries
CREATE INDEX idx_announcements_active ON announcements(date) WHERE ride_completed = FALSE;
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_users_active ON users(last_active) WHERE is_online = TRUE;

-- ============================================
-- COMPLETION
-- ============================================

-- Grant necessary permissions (adjust as needed)
-- GRANT USAGE ON SCHEMA public TO authenticated, anon;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
