-- Simple feedback table creation (no constraints)
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
  resolved_at timestamp with time zone NULL
);

-- Add basic indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback (priority);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback (feedback_type);
