-- ============================================
-- DROP ALL EXISTING TABLES (in correct order)
-- ============================================

-- Drop tables in correct order to respect foreign key constraints
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

-- Drop views if they exist
DROP VIEW IF EXISTS user_profiles CASCADE;
DROP VIEW IF EXISTS announcement_summary CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS cleanup_expired_otps() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_app_settings() CASCADE;
DROP FUNCTION IF EXISTS update_user_rating(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_available_seats(UUID) CASCADE;

-- ============================================
-- EXECUTE THE FULL SCHEMA FROM supabase_schema.sql
-- ============================================

-- Note: After running this script, execute the contents of supabase_schema.sql
-- to recreate all tables with proper structure and RLS policies
