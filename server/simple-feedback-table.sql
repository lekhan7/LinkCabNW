-- Create feedback table with minimal structure first
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

-- Add foreign key constraints (check if they don't exist first)
DO $$
BEGIN
    -- Add user_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feedback_user_id_fkey' 
        AND table_name = 'feedback'
    ) THEN
        ALTER TABLE public.feedback 
        ADD CONSTRAINT feedback_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
    END IF;
    
    -- Add admin_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feedback_admin_id_fkey' 
        AND table_name = 'feedback'
    ) THEN
        ALTER TABLE public.feedback 
        ADD CONSTRAINT feedback_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES public.users (id) ON DELETE SET NULL;
    END IF;
    
    -- Add status check constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'feedback_status_check'
    ) THEN
        ALTER TABLE public.feedback 
        ADD CONSTRAINT feedback_status_check 
        CHECK ((status)::text = ANY (ARRAY['pending', 'reviewed', 'resolved', 'dismissed']::text[]));
    END IF;
    
    -- Add priority check constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'feedback_priority_check'
    ) THEN
        ALTER TABLE public.feedback 
        ADD CONSTRAINT feedback_priority_check 
        CHECK ((priority)::text = ANY (ARRAY['low', 'medium', 'high', 'urgent']::text[]));
    END IF;
    
    -- Add feedback_type check constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'feedback_feedback_type_check'
    ) THEN
        ALTER TABLE public.feedback 
        ADD CONSTRAINT feedback_feedback_type_check 
        CHECK ((feedback_type)::text = ANY (ARRAY['bug_report', 'feature_request', 'general_feedback', 'complaint', 'suggestion']::text[]));
    END IF;
    
    -- Add rating check constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'feedback_rating_check'
    ) THEN
        ALTER TABLE public.feedback 
        ADD CONSTRAINT feedback_rating_check 
        CHECK ((rating >= 1) AND (rating <= 5));
    END IF;
END $$;
