# LinkCab Review System Migration - Complete Guide

## Overview
This migration replaces the old separate `reviews`, `reports`, and `ratings` tables with a unified `refuse` table that handles both reviews and reports with automatic notifications.

## What Changed
- **Dropped Tables**: `reviews`, `reports`, `ratings`
- **New Table**: `refuse` (unified system for reviews and reports)
- **New Functions**: `submit_refuse_review`, `get_user_review_analytics`
- **Updated Analytics**: Both frontend and backend now use the new `refuse` table
- **Notifications**: Automatic notifications sent when users are reviewed

## Files Created/Modified

### Database Files
1. `server/create-unified-refuse-table.sql` - Main migration script
2. `server/test-refuse-system.sql` - Test script to verify functionality

### Backend Files
1. `server/routes/userAnalytics.js` - Updated to use `refuse` table
2. `server/routes/userAnalytics-old.js` - Backup of old version

### Frontend Files
1. `client/src/pages/Analytics.jsx` - Updated to use new table and functions

## Deployment Instructions

### Step 1: Backup Your Database
```sql
-- Create a backup before migration
CREATE TABLE reviews_backup AS SELECT * FROM reviews;
CREATE TABLE reports_backup AS SELECT * FROM reports;
CREATE TABLE ratings_backup AS SELECT * FROM ratings;
```

### Step 2: Run the Migration Script
Execute the main migration script in your Supabase SQL editor:
```sql
-- Run this script in Supabase SQL Editor
-- File: server/create-unified-refuse-table.sql
```

### Step 3: Test the System
Run the test script to verify everything works:
```sql
-- Run this script in Supabase SQL Editor
-- File: server/test-refuse-system.sql
```

### Step 4: Update Your Application
1. Restart your Node.js server to load the new routes
2. Clear browser cache or refresh the frontend
3. Test the analytics page to ensure it loads properly

## New Refuse Table Structure

```sql
CREATE TABLE refuse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES announcements(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    
    -- Review data
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    review_description TEXT NOT NULL,
    
    -- Report data (optional - can be null for pure reviews)
    is_report BOOLEAN DEFAULT FALSE,
    report_category VARCHAR(50),
    report_description TEXT,
    report_severity VARCHAR(20) DEFAULT 'medium',
    report_status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(announcement_id, reviewer_id, reviewee_id),
    CHECK (reviewer_id != reviewee_id),
    CHECK (is_report = FALSE OR (is_report = TRUE AND report_category IS NOT NULL))
);
```

## New Functions

### submit_refuse_review
Submits a review and automatically:
- Updates user's average rating
- Creates a notification for the reviewed user
- Validates ride completion and participant status

```sql
SELECT * FROM submit_refuse_review(
    'announcement_uuid',
    'reviewer_uuid', 
    'reviewee_uuid',
    5,
    'Great ride!'
);
```

### get_user_review_analytics
Gets comprehensive analytics for a user including:
- Reviews given and received
- Average ratings
- All review data in JSON format

```sql
SELECT * FROM get_user_review_analytics('user_uuid');
```

## Notification System

The system now automatically sends notifications when:
- A user reviews another user
- Notification type: `NEW_REVIEW`
- Message: "You have been reviewed by [username] with [stars] stars"

## Security Features
- Row Level Security (RLS) enabled
- Users can only see their own reviews/reports
- Admins can view all entries
- Proper validation on review submissions

## API Changes

### Updated Endpoints
All analytics endpoints now use the `refuse` table:
- `GET /api/analytics/ratings` - Uses `refuse` table
- `GET /api/analytics/reviews` - Uses `refuse` table  
- `GET /api/analytics/platform` - Uses `refuse` table

### Frontend Changes
- Real-time subscriptions updated to listen to `refuse` table
- Analytics page uses new `get_user_review_analytics` function
- Review display updated to use new field names

## Testing Checklist

After deployment, verify:
- [ ] Analytics page loads without errors
- [ ] Review submission works
- [ ] Notifications are sent for new reviews
- [ ] Star distribution displays correctly
- [ ] User can see their reviews
- [ ] Admin analytics work properly

## Rollback Plan

If you need to rollback:
```sql
-- Drop the new table
DROP TABLE IF EXISTS refuse CASCADE;

-- Restore old tables
CREATE TABLE reviews AS SELECT * FROM reviews_backup;
CREATE TABLE reports AS SELECT * FROM reports_backup;
CREATE TABLE ratings AS SELECT * FROM ratings_backup;

-- Restore old routes
mv server/routes/userAnalytics.js server/routes/userAnalytics-new.js
mv server/routes/userAnalytics-old.js server/routes/userAnalytics.js
```

## Troubleshooting

### Common Issues
1. **Analytics page shows no data**: Check if the `get_user_review_analytics` function exists
2. **Review submission fails**: Verify RLS policies are correct
3. **Notifications not working**: Check if `NEW_REVIEW` type is in notification constraints

### Debug Queries
```sql
-- Check if refuse table exists
SELECT * FROM information_schema.tables WHERE table_name = 'refuse';

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN ('submit_refuse_review', 'get_user_review_analytics');

-- Check sample data
SELECT COUNT(*) FROM refuse WHERE is_report = false;
```

## Performance Considerations
- New indexes on `refuse` table for optimal performance
- JSON aggregation in analytics function reduces query count
- Real-time subscriptions filter by user ID for efficiency

## Support
For issues with this migration:
1. Check the test script results
2. Verify all files were updated correctly
3. Ensure Supabase permissions are correct
4. Check browser console for frontend errors

---

**Migration Complete! 🎉**

Your LinkCab review system is now unified with automatic notifications and improved analytics.
