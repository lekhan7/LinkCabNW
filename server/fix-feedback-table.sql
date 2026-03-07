-- Drop and recreate feedback table with proper constraints
-- Run this in Supabase SQL editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.feedback CASCADE;

-- Recreate table with proper constraints
CREATE TABLE public.feedback (
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

-- Add foreign key constraints
ALTER TABLE public.feedback 
  ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  ADD CONSTRAINT feedback_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback (feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at DESC);

-- Add sample test data
INSERT INTO public.feedback (user_id, rating, feedback_type, subject, message, status, priority) VALUES
('00000000-0000-0000-0000-000000000001', 5, 'compliment', 'Great Service!', 'The ride was excellent and the driver was very professional.', 'pending', 'medium'),
('00000000-0000-0000-0000-000000000001', 4, 'suggestion', 'App Improvement', 'Would be great to have real-time tracking updates.', 'pending', 'low'),
('00000000-0000-0000-0000-000000000001', 3, 'complaint', 'Late Arrival', 'The driver arrived 15 minutes late.', 'pending', 'high'),
('00000000-0000-0000-0000-000000000001', 5, 'bug_report', 'App Crash', 'The app crashes when I try to open the map view.', 'pending', 'urgent'),
('00000000-0000-0000-0000-000000000001', 4, 'general_feedback', 'Good Experience', 'Overall the app works well and is easy to use.', 'pending', 'medium');

-- Check the data
SELECT * FROM public.feedback LIMIT 5;
