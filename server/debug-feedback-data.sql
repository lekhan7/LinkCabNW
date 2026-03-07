-- Check if feedback data exists and debug the issue
-- Run this in Supabase SQL editor

-- Check if feedback table exists and has data
SELECT 
  COUNT(*) as total_feedback,
  'feedback table' as table_name
FROM public.feedback
UNION ALL
SELECT 
  COUNT(*) as total_users,
  'users table' as table_name
FROM public.users;

-- Show all feedback data if it exists
SELECT 
  f.id,
  f.user_id,
  f.rating,
  f.feedback_type,
  f.subject,
  f.message,
  f.status,
  f.priority,
  f.created_at,
  u.name as user_name,
  u.email as user_email
FROM public.feedback f
LEFT JOIN users u ON f.user_id = u.id
ORDER BY f.created_at DESC;

-- Check if there are any constraint issues
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.feedback'::regclass;

-- Check table structure using information_schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'feedback' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
