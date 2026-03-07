# Review and Report System Fix Guide

## Issues Identified and Fixed

### 1. **Missing Reports Table**
- **Problem**: The `reports` table was missing from the database schema
- **Fix**: Created complete reports table with proper columns and constraints

### 2. **Incorrect Table References in Database Functions**
- **Problem**: Database functions referenced `ride_reviews` and `ride_reports` tables that don't exist
- **Fix**: Updated functions to use correct table names (`reviews` and `reports`)

### 3. **Missing Database Columns**
- **Problem**: `users.total_reviews` and `announcements.ride_completed` columns were missing
- **Fix**: Added missing columns with proper defaults

### 4. **Inconsistent Participant Table References**
- **Problem**: Functions referenced `ride_participants` instead of `announcement_participants`
- **Fix**: Updated all references to use the correct table name

## Files Created/Modified

### Database Files
1. `server/create-reports-table.sql` - Creates the missing reports table
2. `server/create-submit-review-function.sql` - Fixed review submission function
3. `server/create-submit-report-function.sql` - Fixed report submission function
4. `server/fix-review-report-system.sql` - Comprehensive migration script

### Test Files
1. `client/test-review-report-fix.html` - Complete test interface for all functionality

## Setup Instructions

### Step 1: Run Database Migration
Execute the comprehensive fix script in your Supabase database:

```sql
-- In Supabase SQL Editor, run:
\i server/fix-review-report-system.sql
```

Or run individual files in order:
1. `create-reports-table.sql`
2. `create-submit-review-function.sql` 
3. `create-submit-report-function.sql`

### Step 2: Verify Database Setup
Check that all tables and functions exist:

```sql
-- Verify tables
SELECT * FROM information_schema.tables WHERE table_name IN ('reviews', 'reports', 'announcement_participants');

-- Verify functions
SELECT proname FROM pg_proc WHERE proname IN ('submit_review', 'submit_report');

-- Verify columns
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_reviews';
SELECT column_name FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'ride_completed';
```

### Step 3: Test the System
1. Open `client/test-review-report-fix.html` in your browser
2. Start your backend server (`npm start` in server directory)
3. Test all functionality using the web interface

## Backend API Endpoints

### Review Endpoints
- `POST /api/reviews/submit` - Submit a review
- `GET /api/reviews/:rideId/reviewable-users` - Get users that can be reviewed
- `GET /api/reviews/ride/:rideId` - Get reviews for a ride
- `GET /api/reviews/user/:userId` - Get reviews for a user

### Report Endpoints
- `POST /api/reports/submit` - Submit a report
- `GET /api/reports/reasons` - Get available report reasons
- `GET /api/reports/my-reports` - Get reports filed by current user
- `GET /api/reports/reports-against-me` - Get reports against current user

### Analytics Endpoints
- `GET /api/user-analytics/ratings` - Get user rating analytics
- `GET /api/user-analytics/reviews` - Get user review analytics
- `GET /api/user-analytics/completed-rides` - Get completed rides analytics

## Frontend Integration

### ReviewModal Component
The `ReviewModal` component should work correctly now with the fixed backend. Key features:

1. **Review Submission**: Uses `reviewAPI.submitReview()` 
2. **Report Submission**: Uses `reportAPI.submit()`
3. **Reviewable Users**: Uses `reviewAPI.getReviewableUsers()`
4. **Form Validation**: Ensures required fields are filled

### MyAnnouncements Page
The review submission flow should work properly:

1. User completes a ride
2. "Complete Ride" button triggers review modal
3. Modal shows reviewable users for that ride
4. User can submit reviews and reports
5. Analytics page should display the data correctly

## Common Issues and Solutions

### Issue: "Function does not exist" error
**Solution**: Run the database migration script to create the functions

### Issue: "Table does not exist" error  
**Solution**: Ensure the reports table was created by running the migration

### Issue: Reviews not saving
**Solution**: Check that the announcement has `ride_completed = true` and users are in `announcement_participants` with status 'accepted'

### Issue: Analytics not showing data
**Solution**: Verify that reviews and reports are being saved correctly, and check the analytics API endpoints

### Issue: Permission denied errors
**Solution**: Ensure RLS policies are correctly set up and the user is authenticated

## Testing Checklist

1. ✅ Login works and token is stored
2. ✅ Can get reviewable users for a completed ride
3. ✅ Can submit a review successfully  
4. ✅ Can submit a report successfully
5. ✅ Analytics page shows review data
6. ✅ Review submission updates user's average rating
7. ✅ Cannot review the same user twice for the same ride
8. ✅ Cannot report the same user twice for the same ride

## Database Schema Summary

### Reviews Table
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    ride_id UUID REFERENCES announcements(id),
    reviewer_id UUID REFERENCES users(id), 
    reviewee_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(ride_id, reviewer_id)
);
```

### Reports Table
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY,
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    announcement_id UUID REFERENCES announcements(id),
    category VARCHAR(50),
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(reporter_id, reported_user_id, announcement_id)
);
```

## Next Steps

1. Run the database migration
2. Test using the HTML test file
3. Verify analytics pages display data correctly
4. Test the full user flow in the main application
5. Monitor for any additional issues in production
