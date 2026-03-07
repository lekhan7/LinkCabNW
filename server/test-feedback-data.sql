-- Simple test to check feedback data and add sample if needed
-- Run this in Supabase SQL editor

-- Check if feedback data exists
SELECT COUNT(*) as feedback_count FROM public.feedback;

-- Show any existing feedback
SELECT 
  'Existing Feedback' as info,
  f.id,
  f.user_id,
  f.feedback_type,
  f.subject,
  f.status,
  f.created_at,
  u.name as user_name
FROM public.feedback f
LEFT JOIN users u ON f.user_id = u.id
ORDER BY f.created_at DESC
LIMIT 5;

-- If no feedback exists, add sample data with real user
-- First get a real user ID
SELECT 'Available users:' as info, id, name, email FROM users LIMIT 3;

-- Then add feedback using the first real user
INSERT INTO public.feedback (user_id, rating, feedback_type, subject, message, status, priority) 
SELECT 
  id, 
  5, 
  'compliment', 
  'Great Service!', 
  'The ride was excellent and the driver was very professional.', 
  'pending', 
  'medium'
FROM users 
WHERE id IS NOT NULL
LIMIT 1;

-- Add more sample feedback
INSERT INTO public.feedback (user_id, rating, feedback_type, subject, message, status, priority) 
SELECT 
  id, 
  4, 
  'suggestion', 
  'App Improvement', 
  'Would be great to have real-time tracking updates.', 
  'pending', 
  'low'
FROM users 
WHERE id IS NOT NULL
LIMIT 1;

INSERT INTO public.feedback (user_id, rating, feedback_type, subject, message, status, priority) 
SELECT 
  id, 
  3, 
  'complaint', 
  'Late Arrival', 
  'The driver arrived 15 minutes late.', 
  'pending', 
  'high'
FROM users 
WHERE id IS NOT NULL
LIMIT 1;

-- Check the results
SELECT 
  'Final Feedback Data' as info,
  COUNT(*) as total_feedback
FROM public.feedback;

-- Show all feedback with user info
SELECT 
  f.id,
  f.feedback_type,
  f.subject,
  f.message,
  f.status,
  f.priority,
  f.rating,
  f.created_at,
  u.name as user_name,
  u.email as user_email
FROM public.feedback f
LEFT JOIN users u ON f.user_id = u.id
ORDER BY f.created_at DESC;
