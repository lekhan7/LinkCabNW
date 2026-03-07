-- Fix for feedback table with proper user ID
-- Run this in Supabase SQL editor

-- First, let's see what users exist
SELECT id, name, email FROM users LIMIT 5;

-- Drop the old constraint and add new one
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_feedback_type_check;
ALTER TABLE public.feedback 
  ADD CONSTRAINT feedback_feedback_type_check 
  CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback', 'complaint', 'suggestion', 'compliment'));

-- Get a real user ID or create test data with a real user
-- Option 1: Use the first existing user
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
LIMIT 1;

-- Option 2: Add more sample data with existing users
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
LIMIT 1;

-- Check the data
SELECT 
  f.*,
  u.name,
  u.email 
FROM public.feedback f 
LEFT JOIN users u ON f.user_id = u.id 
LIMIT 5;
