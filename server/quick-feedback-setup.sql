-- Quick test and setup for feedback table
-- Run this in Supabase SQL editor

-- First, let's see if the table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'feedback' AND table_schema = 'public';

-- If no results above, create the table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  rating integer NULL,
  feedback_type character varying(50) NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status character varying(20) NULL DEFAULT 'pending',
  priority character varying(10) NULL DEFAULT 'medium',
  admin_response text NULL,
  admin_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at timestamp with time zone NULL,
  
  -- Add proper check constraints
  CONSTRAINT feedback_feedback_type_check CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback', 'complaint', 'suggestion', 'compliment')),
  CONSTRAINT feedback_status_check CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  CONSTRAINT feedback_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Add some sample test data
INSERT INTO public.feedback (user_id, rating, feedback_type, subject, message, status, priority) VALUES
('00000000-0000-0000-0000-000000000001', 5, 'compliment', 'Great Service!', 'The ride was excellent and the driver was very professional.', 'pending', 'medium'),
('00000000-0000-0000-0000-000000000001', 4, 'suggestion', 'App Improvement', 'Would be great to have real-time tracking updates.', 'pending', 'low'),
('00000000-0000-0000-0000-000000000001', 3, 'complaint', 'Late Arrival', 'The driver arrived 15 minutes late.', 'pending', 'high');

-- Check the data
SELECT * FROM public.feedback LIMIT 5;
