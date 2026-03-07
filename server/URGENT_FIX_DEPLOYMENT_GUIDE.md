# 🚨 URGENT: Fix 500 Errors - Deployment Guide

## Problem
You're getting 500 Internal Server Errors because the new database functions haven't been deployed to Supabase yet.

## Quick Fix (Immediate)

### 1. Deploy Fallback Functions First
Run this in Supabase SQL Editor **RIGHT NOW**:

```sql
-- Copy and paste this entire script into Supabase SQL Editor
\i fix-notification-errors.sql
```

This will create fallback functions that work immediately.

### 2. Restart Your Server
```bash
# Stop the server (Ctrl+C)
# Start it again
npm start
```

### 3. Test the APIs
- Notifications API should work: `GET /api/notifications`
- Join request should work: `POST /api/announcements/:id/join`

## Full Deployment (Recommended)

After the quick fix works, deploy the complete system:

### Step 1: Deploy Join Request Notifications
```sql
-- In Supabase SQL Editor
\i join_request_notifications.sql
```

### Step 2: Deploy Enhanced Favorite Notifications  
```sql
-- In Supabase SQL Editor
\i enhanced_favorite_notifications.sql
```

### Step 3: Update API Routes
The fallback functions will automatically switch to the enhanced ones when they become available.

## What the Fixes Do

### Fallback Functions (`fix-notification-errors.sql`)
- `get_user_notifications_fallback()` - Returns notifications with WhatsApp/redirect URLs
- `mark_notification_read_fallback()` - Marks as read and returns redirect URL
- Works with existing database schema

### Enhanced Functions
- `get_user_notifications_with_redirect()` - Full featured version
- `mark_notification_read_with_redirect()` - Enhanced with better error handling
- `create_join_request_notification()` - Join request notifications
- `update_participant_with_notifications()` - Accept/reject with notifications

### API Route Updates
- **Notifications**: Tries enhanced first, falls back to basic
- **Announcements**: Tries enhanced notification creation, falls back to direct insert
- **Join Response**: Tries enhanced update, falls back to basic update + notification

## Testing After Deployment

### 1. Test Notifications API
```javascript
// Should return notifications with redirect_url and whatsapp_url
fetch('/api/notifications?limit=1')
```

### 2. Test Join Request
```javascript
// Should create notification for announcement creator
fetch('/api/announcements/announcement-id/join', { method: 'POST' })
```

### 3. Test Favorite Route Matching
```javascript
// Create a favorite route, then create matching announcement
// Should automatically create FAVORITE_ROUTE_MATCH notification
```

## Verification

### Check Functions Exist
```sql
SELECT proname FROM pg_proc 
WHERE proname IN (
  'get_user_notifications_fallback',
  'mark_notification_read_fallback',
  'create_join_request_notification',
  'update_participant_with_notifications'
);
```

### Check Notifications Work
```sql
SELECT * FROM notifications 
WHERE type IN ('join_request', 'join_accepted', 'join_rejected', 'FAVORITE_ROUTE_MATCH')
ORDER BY created_at DESC;
```

## Troubleshooting

### Still Getting 500 Errors?
1. **Check Supabase Logs**: Look for function creation errors
2. **Verify Permissions**: Make sure functions have `GRANT EXECUTE`
3. **Check Schema**: Ensure `notifications` table exists and has correct columns
4. **Restart Server**: Always restart after deploying functions

### API Not Working?
1. **Check Server Logs**: Look for RPC function errors
2. **Test RPC Directly**: Run functions in Supabase SQL Editor
3. **Verify Environment**: Check `JWT_SECRET` and database connection

## Priority Order

1. **URGENT**: Deploy `fix-notification-errors.sql` (fixes 500 errors)
2. **HIGH**: Deploy `join_request_notifications.sql` (enables join notifications)  
3. **MEDIUM**: Deploy `enhanced_favorite_notifications.sql` (enables favorite matching)

The fallback system ensures your app works even before full deployment.
