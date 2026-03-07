-- ============================================
-- DATABASE EXTENSIONS FOR NEW FEATURES
-- ============================================

-- Extend ANNOUNCEMENTS table with completion tracking
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS creator_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS completion_status VARCHAR(20) DEFAULT 'active' CHECK (completion_status IN ('active', 'pending_completion', 'completed'));
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS ride_time_timestamp TIMESTAMP;

-- Add indexes for new completion fields
CREATE INDEX IF NOT EXISTS idx_announcements_completion_status ON announcements(completion_status);
CREATE INDEX IF NOT EXISTS idx_announcements_creator_completed ON announcements(creator_completed);

-- Extend ANNOUNCEMENT_PARTICIPANTS table with completion tracking
ALTER TABLE announcement_participants ADD COLUMN IF NOT EXISTS co_passenger_completed BOOLEAN DEFAULT FALSE;

-- Add index for co-passenger completion
CREATE INDEX IF NOT EXISTS idx_participants_co_passenger_completed ON announcement_participants(co_passenger_completed);

-- Create REPORTS table for user reporting system
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reported_user_id UUID NOT NULL REFERENCES users(id),
    announcement_id UUID REFERENCES announcements(id),
    review_id UUID REFERENCES reviews(id),
    category VARCHAR(50) NOT NULL CHECK (category IN ('inappropriate_behavior', 'no_show', 'late_arrival', 'unsafe_driving', 'payment_issue', 'communication_issue', 'other')),
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (reporter_id != reported_user_id)
);

-- Add indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_announcement ON reports(announcement_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);

-- Create RIDE_COMPLETION_EVENTS table for tracking completion events
CREATE TABLE IF NOT EXISTS ride_completion_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES announcements(id),
    user_id UUID NOT NULL REFERENCES users(id),
    completion_type VARCHAR(20) NOT NULL CHECK (completion_type IN ('creator', 'co_passenger')),
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for completion events
CREATE INDEX IF NOT EXISTS idx_completion_events_announcement ON ride_completion_events(announcement_id);
CREATE INDEX IF NOT EXISTS idx_completion_events_user ON ride_completion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_completion_events_type ON ride_completion_events(completion_type);

-- Apply updated_at trigger to new tables
CREATE TRIGGER IF NOT EXISTS update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_ride_completion_events_updated_at BEFORE UPDATE ON ride_completion_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_completion_events ENABLE ROW LEVEL SECURITY;

-- Function to check if ride can be marked as completed
CREATE OR REPLACE FUNCTION can_complete_ride(announcement_uuid UUID, user_uuid UUID, completion_type VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    is_creator BOOLEAN;
    is_participant BOOLEAN;
    ride_time TIMESTAMP;
    current_time TIMESTAMP;
BEGIN
    -- Check if user is creator
    SELECT created_by = user_uuid INTO is_creator FROM announcements WHERE id = announcement_uuid;
    
    -- Check if user is accepted participant
    SELECT EXISTS(
        SELECT 1 FROM announcement_participants 
        WHERE announcement_id = announcement_uuid 
        AND user_id = user_uuid 
        AND status = 'accepted'
    ) INTO is_participant;
    
    -- Get ride time
    SELECT date || ' ' || time INTO ride_time FROM announcements WHERE id = announcement_uuid;
    
    -- Current time
    current_time := CURRENT_TIMESTAMP;
    
    -- Check if ride time has passed (with 30 minute buffer)
    IF ride_time > (current_time - INTERVAL '30 minutes') THEN
        RETURN FALSE;
    END IF;
    
    -- Check permissions based on completion type
    IF completion_type = 'creator' AND is_creator THEN
        RETURN TRUE;
    ELSIF completion_type = 'co_passenger' AND is_participant THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to update ride completion status
CREATE OR REPLACE FUNCTION update_ride_completion_status(announcement_uuid UUID)
RETURNS void AS $$
DECLARE
    creator_done BOOLEAN;
    all_participants_done BOOLEAN;
    total_participants INTEGER;
    completed_participants INTEGER;
BEGIN
    -- Check if creator completed
    SELECT creator_completed INTO creator_done FROM announcements WHERE id = announcement_uuid;
    
    -- Check if all accepted participants completed
    SELECT COUNT(*) INTO total_participants
    FROM announcement_participants 
    WHERE announcement_id = announcement_uuid AND status = 'accepted';
    
    SELECT COUNT(*) INTO completed_participants
    FROM announcement_participants 
    WHERE announcement_id = announcement_uuid 
    AND status = 'accepted' 
    AND co_passenger_completed = TRUE;
    
    all_participants_done := (completed_participants = total_participants);
    
    -- Update announcement status
    IF creator_done AND all_participants_done THEN
        UPDATE announcements 
        SET completion_status = 'completed', ride_completed = TRUE 
        WHERE id = announcement_uuid;
    ELSIF creator_done OR all_participants_done THEN
        UPDATE announcements 
        SET completion_status = 'pending_completion' 
        WHERE id = announcement_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create favorite ride match notification
CREATE OR REPLACE FUNCTION create_favorite_match_notification(announcement_uuid UUID)
RETURNS void AS $$
DECLARE
    announcement_record RECORD;
    matching_users RECORD;
BEGIN
    -- Get announcement details
    SELECT * INTO announcement_record 
    FROM announcements 
    WHERE id = announcement_uuid;
    
    -- Find users with matching favorite routes
    FOR matching_users IN 
        SELECT DISTINCT fr.user_id, u.name, u.email
        FROM favorite_routes fr
        JOIN users u ON fr.user_id = u.id
        WHERE (
            (fr.from_location ILIKE announcement_record.start_location_name OR 
             announcement_record.start_location_name ILIKE '%' || fr.from_location || '%') AND
            (fr.to_location ILIKE announcement_record.destination_name OR 
             announcement_record.destination_name ILIKE '%' || fr.to_location || '%')
        )
        AND fr.user_id != announcement_record.created_by
    LOOP
        -- Create notification for matching user
        INSERT INTO notifications (
            recipient_id, 
            sender_id, 
            type, 
            title, 
            message, 
            announcement_id
        ) VALUES (
            matching_users.user_id,
            announcement_record.created_by,
            'FAVORITE_ROUTE_MATCH',
            'New ride on your favorite route!',
            format('%s has created a ride from %s to %s on %s at %s', 
                (SELECT name FROM users WHERE id = announcement_record.created_by),
                announcement_record.start_location_name,
                announcement_record.destination_name,
                announcement_record.date,
                announcement_record.time
            ),
            announcement_uuid
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
