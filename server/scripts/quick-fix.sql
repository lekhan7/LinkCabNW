-- ============================================
-- Quick Fix for Duplicate Key Error
-- ============================================

-- Clear existing data safely
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS preferred_travel_places CASCADE;
DROP TABLE IF EXISTS preferred_locations CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS announcement_participants CASCADE;
DROP TABLE IF EXISTS announcement_completion_status CASCADE;
DROP TABLE IF EXISTS rides CASCADE;
DROP TABLE IF EXISTS ride_shares CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS favorite_routes CASCADE;
DROP TABLE IF EXISTS connection_requests CASCADE;
DROP TABLE IF EXISTS otps CASCADE;

-- Drop views and functions
DROP VIEW IF EXISTS user_profiles CASCADE;
DROP VIEW IF EXISTS announcement_summary CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_otps() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_app_settings() CASCADE;
DROP FUNCTION IF EXISTS update_user_rating(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_available_seats(UUID) CASCADE;

-- ============================================
-- RECREATE ALL TABLES
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

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

-- ANNOUNCEMENT PARTICIPANTS
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

-- OTP TABLE
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
CREATE TRIGGER update_otps_updated_at BEFORE UPDATE ON otps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT DATA (Fixed Syntax)
-- ============================================

-- Insert default app settings using INSERT ... ON CONFLICT
INSERT INTO app_settings (theme_primary_color, theme_secondary_color, app_name) 
VALUES ('#3B82F6', '#10B981', 'LinkCab')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================

-- Enable RLS on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
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
-- COMPLETION
-- ============================================

-- Grant necessary permissions (adjust as needed)
-- GRANT USAGE ON SCHEMA public TO authenticated, anon;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
