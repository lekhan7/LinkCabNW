-- Simple fix for feedback table constraint
-- Run this in Supabase SQL editor

-- First, drop the existing constraint
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_feedback_type_check;

-- Add the new constraint with all valid types including compliment
ALTER TABLE public.feedback 
  ADD CONSTRAINT feedback_feedback_type_check 
  CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback', 'complaint', 'suggestion', 'compliment'));

-- Now try to insert the sample data
INSERT INTO public.feedback (user_id, rating, feedback_type, subject, message, status, priority) VALUES
('00000000-0000-0000-0000-000000000001', 5, 'compliment', 'Great Service!', 'The ride was excellent and the driver was very professional.', 'pending', 'medium'),
('00000000-0000-0000-0000-000000000001', 4, 'suggestion', 'App Improvement', 'Would be great to have real-time tracking updates.', 'pending', 'low'),
('00000000-0000-0000-0000-000000000001', 3, 'complaint', 'Late Arrival', 'The driver arrived 15 minutes late.', 'pending', 'high');

-- Check the data
SELECT * FROM public.feedback LIMIT 5;
